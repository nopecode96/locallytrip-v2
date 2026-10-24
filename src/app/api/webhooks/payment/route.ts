import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendTransactionEmail } from '@/lib/mailjet';

/**
 * Payment Webhook Handler
 * Menerima payload webhook status transaksi (misal: simulator, Midtrans, Stripe, PayPal)
 * dan mengupdate status payment serta booking secara atomik.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { booking_reference, order_id, transaction_status, status, payment_type } = body;

    const ref = booking_reference || order_id;

    if (!ref) {
      return NextResponse.json(
        { success: false, message: 'Missing booking_reference or order_id' },
        { status: 400 }
      );
    }

    const booking = await prisma.bookings.findFirst({
      where: {
        OR: [
          { booking_reference: String(ref) },
          { paypal_order_id: String(ref) },
        ],
      },
      include: {
        payments: {
          orderBy: { created_at: 'desc' },
        },
        experiences: true,
        users: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: 'Booking not found' },
        { status: 404 }
      );
    }

    const isSuccess =
      transaction_status === 'settlement' ||
      transaction_status === 'capture' ||
      transaction_status === 'paid' ||
      transaction_status === 'COMPLETED' ||
      status === 'paid' ||
      status === 'confirmed' ||
      status === 'COMPLETED';

    const isCancelled =
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire' ||
      status === 'cancelled';

    const now = new Date();

    if (isSuccess) {
      await prisma.$transaction(async (tx) => {
        if (booking.payments.length > 0) {
          await tx.payments.update({
            where: { id: booking.payments[0].id },
            data: {
              status: 'paid',
              gateway_payment_method: payment_type || 'webhook',
              payment_date: now,
              updated_at: now,
            },
          });
        } else {
          await tx.payments.create({
            data: {
              booking_id: booking.id,
              user_id: booking.user_id || 1,
              amount: booking.total_price,
              currency: 'IDR',
              status: 'paid',
              payment_gateway: 'webhook',
              gateway_payment_method: payment_type || 'webhook',
              payment_date: now,
              experience_price: booking.total_price,
              created_at: now,
              updated_at: now,
            },
          });
        }

        await tx.bookings.update({
          where: { id: booking.id },
          data: {
            status: 'confirmed',
            updated_at: now,
          },
        });

        if (booking.experiences?.host_id) {
          await tx.notifications.create({
            data: {
              user_id: booking.experiences.host_id,
              title: 'Pembayaran Tur Diterima! 💳',
              message: `Pembayaran untuk pesanan #${booking.booking_reference} telah lunas via Webhook.`,
              type: 'BOOKING',
              action_url: `/dashboard?tab=host-bookings`,
              created_at: now,
              updated_at: now,
            },
          });
        }

        if (booking.user_id) {
          await tx.notifications.create({
            data: {
              user_id: booking.user_id,
              title: 'Pembayaran Tur Berhasil! 🎉',
              message: `Pembayaran tiket pesanan #${booking.booking_reference} telah lunas via Webhook. Selamat berpetualang!`,
              type: 'BOOKING',
              action_url: `/dashboard?tab=my-trips`,
              created_at: now,
              updated_at: now,
            },
          });
        }
      });

      // Kirim email konfirmasi transaksi via Mailjet secara non-blocking
      const recipientEmail =
        booking.users?.email ||
        ((booking.contact_info as any)?.email as string) ||
        '';
      const recipientName =
        booking.users?.name ||
        ((booking.contact_info as any)?.name as string) ||
        'Traveler';

      if (recipientEmail) {
        sendTransactionEmail(
          recipientEmail,
          recipientName,
          booking.booking_reference || String(booking.id),
          Number(booking.total_price),
          {
            currency: booking.payments[0]?.currency || 'IDR',
            experienceTitle: booking.experiences?.title,
          }
        )
          .then((mRes) => {
            console.log(
              `[Mailjet:PaymentWebhook] Invoice sent to ${recipientEmail} for ref #${booking.booking_reference} (Status: ${mRes.status})`
            );
          })
          .catch((mErr) => {
            console.error(
              `[Mailjet:PaymentWebhook] Failed to send email to ${recipientEmail}:`,
              mErr?.message || mErr
            );
          });
      }
    } else if (isCancelled) {
      await prisma.$transaction(async (tx) => {
        if (booking.payments.length > 0) {
          await tx.payments.update({
            where: { id: booking.payments[0].id },
            data: {
              status: 'failed',
              updated_at: now,
            },
          });
        }

        await tx.bookings.update({
          where: { id: booking.id },
          data: {
            status: 'cancelled',
            updated_at: now,
          },
        });
      });
    }

    try {
      revalidatePath('/[lang]/dashboard');
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Payment webhook processed successfully',
      booking_reference: booking.booking_reference,
      status: isSuccess ? 'confirmed' : isCancelled ? 'cancelled' : booking.status,
    });
  } catch (error) {
    console.error('Payment webhook processing error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}

'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendTransactionEmail } from '@/lib/mailjet';

export async function simulatePaymentSuccess(bookingReference: string) {
  try {
    if (!bookingReference) {
      return { success: false, message: 'Kode referensi pesanan tidak valid' };
    }

    // 1. Cari booking beserta payment terkait
    const booking = await prisma.bookings.findUnique({
      where: { booking_reference: bookingReference },
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
      return { success: false, message: 'Pesanan tidak ditemukan' };
    }

    // 2. Transaksi atomik Prisma: update payment & booking
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Update payment terakhir menjadi 'paid'
      if (booking.payments.length > 0) {
        await tx.payments.update({
          where: { id: booking.payments[0].id },
          data: {
            status: 'paid',
            gateway_payment_method: 'simulator_instant',
            payment_date: now,
            updated_at: now,
          },
        });
      } else {
        // Jika belum ada record payment, buatkan record payment paid
        await tx.payments.create({
          data: {
            booking_id: booking.id,
            user_id: booking.user_id || 1,
            amount: booking.total_price,
            currency: 'IDR',
            status: 'paid',
            payment_gateway: 'simulator',
            gateway_payment_method: 'simulator_instant',
            payment_date: now,
            experience_price: booking.total_price,
            created_at: now,
            updated_at: now,
          },
        });
      }

      // Update status booking menjadi 'confirmed'
      await tx.bookings.update({
        where: { id: booking.id },
        data: {
          status: 'confirmed',
          updated_at: now,
        },
      });

      // 1. Buat notifikasi untuk host tur
      if (booking.experiences?.host_id) {
        await tx.notifications.create({
          data: {
            user_id: booking.experiences.host_id,
            title: 'Pembayaran Tur Diterima! 💳',
            message: `Pembayaran untuk pesanan #${booking.booking_reference} telah lunas. Jadwal tur siap dikonfirmasi.`,
            type: 'BOOKING',
            action_url: `/dashboard?tab=host-bookings`,
            created_at: now,
            updated_at: now,
          },
        });
      }

      // 2. Buat notifikasi untuk traveler pemesan
      if (booking.user_id) {
        await tx.notifications.create({
          data: {
            user_id: booking.user_id,
            title: 'Pembayaran Tur Berhasil! 🎉',
            message: `Pembayaran tiket pesanan #${booking.booking_reference} telah lunas. Selamat berpetualang!`,
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
        booking.booking_reference || bookingReference || String(booking.id),
        Number(booking.total_price),
        {
          currency: booking.payments[0]?.currency || 'IDR',
          experienceTitle: booking.experiences?.title,
        }
      )
        .then((mRes) => {
          console.log(
            `[Mailjet:SimulatePayment] Invoice sent to ${recipientEmail} for ref #${booking.booking_reference} (Status: ${mRes.status})`
          );
        })
        .catch((mErr) => {
          console.error(
            `[Mailjet:SimulatePayment] Failed to send invoice email to ${recipientEmail}:`,
            mErr?.message || mErr
          );
        });
    }

    try {
      revalidatePath('/[lang]/dashboard', 'page');
    } catch {
      // Invariant safe if invoked from CLI script
    }
    return { success: true, message: 'Pembayaran berhasil disimulasikan!' };
  } catch (error) {
    console.error('Simulate payment error:', error);
    return { success: false, message: 'Gagal memproses simulasi pembayaran' };
  }
}

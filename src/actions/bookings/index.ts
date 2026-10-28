'use server';

import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';
import { getPublicImageUrl } from '@/lib/images';
import { createAdminNotification } from '@/actions/admin/notifications';
import { calculateExperienceBookingFee } from '@/lib/fees';

export interface CreateBookingInput {
  experienceId: number;
  selectedDate: string; // YYYY-MM-DD
  participantCount: number;
  useLtpPoints?: boolean;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface UserWalletInfo {
  userId: number;
  balance: number;
  balanceInIdr: number;
}

/**
 * Mengambil session user aktif dari cookie atau user demo (Joyslana / id: 209)
 */
export async function getCurrentUserSession(): Promise<{
  id: number;
  name: string;
  email: string;
  role?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  isLoggedIn: boolean;
} | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('locallytrip_session')?.value;

  if (sessionToken) {
    try {
      const session = await prisma.user_sessions.findUnique({
        where: { session_token: sessionToken },
        include: { users: true },
      });
      if (session?.users) {
        return {
          id: session.users.id,
          name: session.users.name || session.users.username || 'User',
          email: session.users.email,
          role: session.users.role,
          username: session.users.username,
          avatar_url: session.users.avatar_url,
          isLoggedIn: true,
        };
      }
    } catch {
      // Ignore
    }
  }

  // Jika cookie belum ada atau tamu, kembalikan null
  return null;
}

/**
 * Server Action: Cepat login tamu / demo
 */
export async function loginQuickUser(userId: number = 209): Promise<{ success: boolean; user: any }> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, username: true },
  });

  if (!user) {
    return { success: false, user: null };
  }

  const token = `sess_${crypto.randomUUID()}`;
  await prisma.user_sessions.create({
    data: {
      user_id: user.id,
      session_token: token,
      device_type: 'desktop',
      browser: 'chrome',
      last_activity_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set('locallytrip_session', token, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
    sameSite: 'lax',
  });

  return { success: true, user };
}

/**
 * Server Action: Cek saldo LTP Wallet pengguna aktif
 */
export async function getUserLtpWallet(userId: number): Promise<UserWalletInfo | null> {
  try {
    const wallet = await prisma.user_ltp_wallets.findUnique({
      where: { user_id: userId },
    });

    const balanceNum = wallet ? Number(wallet.balance) : 0;
    // 1 LTP bernilai ~$1 (atau setara Rp 17.896)
    const balanceInIdr = Math.round(balanceNum * 17896.90);

    return {
      userId,
      balance: balanceNum,
      balanceInIdr,
    };
  } catch (error) {
    console.error('Error fetching user LTP wallet:', error);
    return null;
  }
}

/**
 * Server Action: Buat Pemesanan (Booking Flow)
 */
export async function createBooking(input: CreateBookingInput): Promise<{
  success: boolean;
  data?: {
    bookingId: number;
    bookingReference: string;
    totalAmount: number;
    ltpDiscountApplied: number;
    finalPaidAmount: number;
    platformFee: number;
  };
  error?: string;
}> {
  try {
    const {
      experienceId,
      selectedDate,
      participantCount,
      useLtpPoints = false,
      contactName,
      contactEmail,
      contactPhone = '',
    } = input;

    // 1. Ambil detail experience
    const exp = await prisma.experiences.findUnique({
      where: { id: experienceId },
      include: { users: true },
    });

    if (!exp) {
      return { success: false, error: 'Aktivitas tidak ditemukan.' };
    }

    // 2. Validasi kuota peserta pada tanggal tersebut
    const targetDate = new Date(selectedDate);
    const existingBookings = await prisma.bookings.findMany({
      where: {
        experience_id: experienceId,
        selected_date: targetDate,
        status: { in: ['confirmed', 'paid', 'pending'] },
      },
      select: { participant_count: true },
    });

    const currentBookedCount = existingBookings.reduce(
      (sum, b) => sum + (b.participant_count ?? 1),
      0
    );

    const maxAllowed = exp.max_participants ?? 10;
    if (currentBookedCount + participantCount > maxAllowed) {
      return {
        success: false,
        error: `Kuota tidak mencukupi untuk tanggal ${selectedDate}. Tersisa ${Math.max(0, maxAllowed - currentBookedCount)} kursi.`,
      };
    }

    // 3. User session / fallback user
    const currentUser = await getCurrentUserSession();
    const effectiveUserId = currentUser ? currentUser.id : 209; // Default user Joyslana untuk booking

    // 4. Kalkulasi harga dan take-rate komisi platform dinamis dari platform_fee_configurations
    const pricePerPerson = Number(exp.package_price ?? 0);
    const grossTotal = pricePerPerson * participantCount;
    const feeCalculation = await calculateExperienceBookingFee(grossTotal, targetDate);
    const platformFee = feeCalculation.platformFee;

    // 5. Integrasi Pemotongan Saldo LTP
    let ltpDiscount = 0;
    if (useLtpPoints) {
      const wallet = await prisma.user_ltp_wallets.findUnique({
        where: { user_id: effectiveUserId },
      });
      if (wallet && Number(wallet.balance) > 0) {
        const availableBalance = Number(wallet.balance);
        // Potong hingga maksimal 50% total tagihan
        const maxDeductible = grossTotal * 0.5;
        ltpDiscount = Math.min(availableBalance, maxDeductible);

        // Update saldo dompet LTP
        await prisma.user_ltp_wallets.update({
          where: { user_id: effectiveUserId },
          data: {
            balance: { decrement: ltpDiscount },
            updated_at: new Date(),
          },
        });

        // Catat transaksi LTP
        await prisma.user_ltp_transactions.create({
          data: {
            user_id: effectiveUserId,
            amount: -ltpDiscount,
            type: 'debit',
            activity_type: 'booking_discount',
            source_table: 'bookings',
            created_at: new Date(),
          },
        });
      }
    }

    const finalAmount = Math.max(0, grossTotal - ltpDiscount);
    const bookingRef = `LT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 6. Buat baris baru di tabel bookings
    const createdBooking = await prisma.bookings.create({
      data: {
        uuid: crypto.randomUUID(),
        experience_id: experienceId,
        user_id: effectiveUserId,
        selected_date: targetDate,
        participant_count: participantCount,
        quantity: participantCount,
        total_price: finalAmount,
        status: 'confirmed',
        booking_reference: bookingRef,
        contact_info: {
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
        },
        category_specific: {
          gross_amount: grossTotal,
          platform_fee: platformFee,
          platform_take_rate: `${feeCalculation.feePercent}%`,
          fee_config_id: feeCalculation.configId,
          fee_bearer: feeCalculation.feeBearer,
          ltp_discount_applied: ltpDiscount,
          host_net_earning: feeCalculation.hostNetEarning,
          currency: exp.currency || 'USD',
        },
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    try {
      await createAdminNotification({
        type: 'booking',
        title: 'Pesanan Tur Baru Diterima! 📅',
        message: `Booking baru #${bookingRef} (${exp.title}) dari ${contactName} senilai $${finalAmount}.`,
        action_url: '/bookings',
        data: {
          bookingId: createdBooking.id,
          bookingReference: bookingRef,
          experienceId,
          totalPrice: finalAmount,
        },
      });
    } catch (notifErr) {
      console.error('Failed to notify admin about new booking:', notifErr);
    }

    return {
      success: true,
      data: {
        bookingId: createdBooking.id,
        bookingReference: bookingRef,
        totalAmount: grossTotal,
        ltpDiscountApplied: ltpDiscount,
        finalPaidAmount: finalAmount,
        platformFee,
      },
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem saat membuat pemesanan.',
    };
  }
}

export interface FormattedBookingExperience {
  id: number;
  title: string;
  coverImage: string | null;
  slug: string | null;
  city: string;
  host: {
    name: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface FormattedTravellerBooking {
  id: number;
  bookingRef: string;
  status: string;
  totalPrice: number;
  currency: string;
  bookingDate: string;
  participants: number;
  specialRequests: string | null;
  experience: FormattedBookingExperience;
}

export interface FormattedHostBooking {
  id: number;
  bookingRef: string;
  status: string;
  totalPrice: number;
  currency: string;
  bookingDate: string;
  participants: number;
  specialRequests: string | null;
  guest: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  experienceTitle: string;
  experienceSlug: string | null;
}

export async function getUserBookings(): Promise<{
  travellerBookings: FormattedTravellerBooking[];
  hostBookings: FormattedHostBooking[];
}> {
  const session = await getServerSession(authOptions);
  let userEmail = session?.user?.email;

  if (!userEmail) {
    const internalSession = await getCurrentUserSession();
    if (internalSession?.isLoggedIn && internalSession.email) {
      userEmail = internalSession.email;
    }
  }

  if (!userEmail) return { travellerBookings: [], hostBookings: [] };

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, role: true },
  });

  if (!user) return { travellerBookings: [], hostBookings: [] };

  // 1. Ambil pesanan di mana pengguna adalah Pemesan (Traveller)
  const travellerBookings = await prisma.bookings.findMany({
    where: { user_id: user.id },
    include: {
      experiences: {
        include: {
          users: { select: { id: true, name: true, username: true, avatar_url: true } },
          cities: { select: { name: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  // 2. Ambil pesanan di mana pengguna adalah Penyedia Tur (Host)
  let hostBookings: any[] = [];
  const isHost = user.role?.toUpperCase() === 'HOST';
  if (isHost) {
    hostBookings = await prisma.bookings.findMany({
      where: {
        experiences: {
          host_id: user.id,
        },
      },
      include: {
        users: { select: { id: true, name: true, username: true, avatar_url: true, email: true } },
        experiences: {
          include: {
            cities: { select: { name: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  return {
    travellerBookings: travellerBookings.map((b) => {
      const coverImg = getPublicImageUrl(b.experiences?.images, 'experiences');
      return {
        id: Number(b.id),
        bookingRef: b.booking_reference || `LT-${b.id}`,
        status: (b.status || 'confirmed').toUpperCase(),
        totalPrice: Number(b.total_price || 0),
        currency: (b.category_specific as any)?.currency || 'USD',
        bookingDate: b.selected_date
          ? b.selected_date.toISOString()
          : b.created_at.toISOString(),
        participants: b.participant_count || b.quantity || 1,
        specialRequests: b.special_requests || null,
        experience: {
          id: Number(b.experiences?.id || 0),
          title: b.experiences?.title || 'Pengalaman Lokal',
          coverImage: coverImg,
          slug: b.experiences?.slug || null,
          city: b.experiences?.cities?.name || 'Indonesia',
          host: {
            name: b.experiences?.users?.name || 'Local Host',
            username: b.experiences?.users?.username || 'host',
            avatarUrl: getPublicImageUrl(b.experiences?.users?.avatar_url, 'users'),
          },
        },
      };
    }),
    hostBookings: hostBookings.map((b) => ({
      id: Number(b.id),
      bookingRef: b.booking_reference || `LT-${b.id}`,
      status: (b.status || 'confirmed').toUpperCase(),
      totalPrice: Number(b.total_price || 0),
      currency: (b.category_specific as any)?.currency || 'USD',
      bookingDate: b.selected_date
        ? b.selected_date.toISOString()
        : b.created_at.toISOString(),
      participants: b.participant_count || b.quantity || 1,
      specialRequests: b.special_requests || null,
      guest: {
        name: b.users?.name || 'Tamu Traveller',
        email: b.users?.email || '',
        avatarUrl: getPublicImageUrl(b.users?.avatar_url, 'users'),
      },
      experienceTitle: b.experiences?.title || 'Pengalaman Lokal',
      experienceSlug: b.experiences?.slug || null,
    })),
  };
}



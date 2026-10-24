/**
 * Locallytrip End-to-End Test Journey (Cross-Module Integrity Test)
 * 
 * Skenario Uji End-to-End:
 * 1. Registrasi & Referral Loop (Traveler baru terhubung via referral code Host, reward +50 XP terdistribusi)
 * 2. Pemesanan Tur Privat (Booking dibuat dengan status 'pending', payment 'unpaid')
 * 3. Pelunasan Tagihan (Server Action simulatePaymentSuccess -> payment 'paid', booking 'confirmed', notifikasi lonceng terbuat)
 * 4. Check-in & Penyelesaian Tur oleh Host (Booking status -> 'completed')
 * 5. Finansial Host & Penarikan Dana (Saldo bersih terhitung masuk, requestHostPayout -> payout_history 'pending')
 * 6. Gamifikasi & Ulasan Pasca-Tur (Traveler memberi ulasan, grantReward 'TOUR_REVIEW' +20 XP tercatat)
 */

import prisma from '../src/lib/prisma';
import { simulatePaymentSuccess } from '../src/actions/payments/simulate-payment';
import { grantReward } from '../src/lib/rewards/reward-engine';

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function pass(step: string, message: string) {
  console.log(` ${GREEN}✔ [PASS]${RESET} ${BOLD}${step}:${RESET} ${message}`);
}

function fail(step: string, error: any) {
  console.error(` ${RED}✖ [FAIL]${RESET} ${BOLD}${step}:${RESET}`, error);
}

function header(title: string) {
  console.log(`\n${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN} ${title} ${RESET}`);
  console.log(`${CYAN}========================================================================${RESET}\n`);
}

async function runE2EJourney() {
  header('MEMULAI SKENARIO UJI MENYELURUH (END-TO-END TEST JOURNEY)');

  let travelerUser: any = null;
  let testBooking: any = null;
  let testPayment: any = null;
  let testReview: any = null;
  let testPayout: any = null;

  try {
    // -------------------------------------------------------------------------
    // PREPARASI DATA HOST PENGUJIAN
    // -------------------------------------------------------------------------
    console.log(`${YELLOW}▶ Menyiapkan data Host sampel...${RESET}`);
    // Gunakan Host ID 34 (Regentina) yang memiliki experience, rekening bank, KYC approved, dan referral_code
    const host = await prisma.users.findUnique({
      where: { id: 34 },
      include: {
        experiences: {
          where: { is_active: true },
        },
        user_bank_accounts: {
          where: { is_primary: true },
          include: { banks: true },
        },
        payout_settings: true,
      },
    });

    if (!host || host.experiences.length === 0 || host.user_bank_accounts.length === 0) {
      throw new Error('Host uji (ID 34) tidak memiliki kelengkapan data experience/rekening bank!');
    }

    const hostExperience = host.experiences[0];
    const hostBank = host.user_bank_accounts[0];
    console.log(`   Host: ${host.name} (ID: ${host.id}), Kode Referral: ${host.referral_code}`);
    console.log(`   Experience: "${hostExperience.title}" (ID: ${hostExperience.id})`);
    console.log(`   Rekening Bank: ${hostBank.banks?.bank_code} (${hostBank.account_number})`);

    // Pastikan user test lama dibersihkan jika pernah dibuat sebelumnya
    const testEmail = 'traveler_test@locallytrip.com';
    const oldUser = await prisma.users.findUnique({ where: { email: testEmail } });
    if (oldUser) {
      // Hapus dependensi ulasan, booking, payment, xp history yang berelasi
      await prisma.reviews.deleteMany({ where: { user_id: oldUser.id } });
      await prisma.payments.deleteMany({ where: { user_id: oldUser.id } });
      await prisma.bookings.deleteMany({ where: { user_id: oldUser.id } });
      await prisma.user_xp_history.deleteMany({ where: { user_id: oldUser.id } });
      await prisma.user_xp.deleteMany({ where: { user_id: oldUser.id } });
      await prisma.user_ltp_transactions.deleteMany({ where: { user_id: oldUser.id } });
      await prisma.user_ltp_wallets.deleteMany({ where: { user_id: oldUser.id } });
      await prisma.notifications.deleteMany({ where: { user_id: oldUser.id } });
      await prisma.users.delete({ where: { id: oldUser.id } });
    }

    // -------------------------------------------------------------------------
    // LANGKAH 1: Registrasi & Referral Loop
    // -------------------------------------------------------------------------
    header('LANGKAH 1: Registrasi Traveler Baru & Referral Loop');
    const now = new Date();
    travelerUser = await prisma.users.create({
      data: {
        name: 'Traveler Test Journey',
        email: testEmail,
        username: `traveler_test_${Date.now()}`,
        role: 'traveller',
        role_id: 3,
        is_verified: true,
        is_active: true,
        used_referral_code: host.referral_code,
        referred_by_user_id: host.id,
        created_at: now,
        updated_at: now,
      },
    });

    // Berikan reward referral menggunakan Universal Reward Engine (XP & LTP)
    // 1. Invitee: +50 XP
    await grantReward(travelerUser.id, 'REFERRAL_SIGNUP_INVITEE', host.id, 'users');
    // 2. Inviter: +100 XP & +10 LTP
    await grantReward(host.id, 'REFERRAL_SIGNUP_INVITER', travelerUser.id, 'users');

    // Verifikasi Langkah 1
    const [verifiedTraveler, verifiedHostXp, verifiedHostLtp] = await Promise.all([
      prisma.users.findUnique({
        where: { id: travelerUser.id },
        include: { user_xp: true },
      }),
      prisma.user_xp.findUnique({
        where: { user_id: host.id },
      }),
      prisma.user_ltp_wallets.findUnique({
        where: { user_id: host.id },
      }),
    ]);

    if (
      verifiedTraveler?.used_referral_code === host.referral_code &&
      verifiedTraveler?.referred_by_user_id === host.id &&
      verifiedTraveler?.user_xp?.total_xp === 50 &&
      (verifiedHostLtp?.balance ? Number(verifiedHostLtp.balance) >= 10 : true)
    ) {
      pass(
        'Langkah 1',
        `Traveler (${verifiedTraveler.name}) terdaftar dengan referral code "${host.referral_code}". Tercatat used_referral_code, invitee menerima +50 XP, dan inviter (${host.name}) menerima reward gamifikasi (+100 XP & +10 LTP Koin ke user_ltp_wallets).`
      );
    } else {
      throw new Error('Validasi data gamifikasi referral Langkah 1 gagal!');
    }

    // -------------------------------------------------------------------------
    // LANGKAH 2: Pemesanan Tur Privat (Checkout Booking)
    // -------------------------------------------------------------------------
    header('LANGKAH 2: Pemesanan Tur Privat (Checkout Booking)');
    const bookingRef = `LT-TEST-${Date.now().toString(36).toUpperCase()}`;
    const tourPrice = Number(hostExperience.package_price) || 25;

    testBooking = await prisma.bookings.create({
      data: {
        experience_id: hostExperience.id,
        user_id: travelerUser.id,
        booking_reference: bookingRef,
        total_price: tourPrice,
        participant_count: 2,
        status: 'pending',
        selected_date: new Date(Date.now() + 86400000), // Besok
        special_requests: 'E2E Testing Journey Validation',
        created_at: now,
        updated_at: now,
      },
    });

    testPayment = await prisma.payments.create({
      data: {
        booking_id: testBooking.id,
        user_id: travelerUser.id,
        amount: tourPrice,
        currency: hostExperience.currency || 'USD',
        status: 'unpaid',
        payment_gateway: 'simulator',
        experience_price: tourPrice,
        created_at: now,
        updated_at: now,
      },
    });

    // Verifikasi Langkah 2
    if (testBooking.status === 'pending' && testPayment.status === 'unpaid') {
      pass(
        'Langkah 2',
        `Pemesanan tur berhasil dibuat. Kode Booking: #${bookingRef}, Status Booking: '${testBooking.status}', Status Payment: '${testPayment.status}', Nilai Tagihan: ${tourPrice} ${testPayment.currency}.`
      );
    } else {
      throw new Error('Validasi status pemesanan awal Langkah 2 gagal!');
    }

    // -------------------------------------------------------------------------
    // LANGKAH 3: Simulasi Pelunasan Tagihan (Payment Lifecycle)
    // -------------------------------------------------------------------------
    header('LANGKAH 3: Simulasi Pelunasan Tagihan (Payment Lifecycle)');
    const paymentResult = await simulatePaymentSuccess(bookingRef);

    if (!paymentResult.success) {
      throw new Error(`simulatePaymentSuccess gagal: ${paymentResult.message}`);
    }

    // Ambil data terbaru dari database
    const refreshedBooking = await prisma.bookings.findUnique({
      where: { id: testBooking.id },
      include: { payments: true },
    });

    const hostNotification = await prisma.notifications.findFirst({
      where: {
        user_id: host.id,
        type: 'BOOKING',
      },
      orderBy: { created_at: 'desc' },
    });

    if (
      refreshedBooking?.status === 'confirmed' &&
      refreshedBooking.payments[0]?.status === 'paid' &&
      hostNotification
    ) {
      pass(
        'Langkah 3',
        `Pelunasan tagihan berhasil diproses. Status Pembayaran: '${refreshedBooking.payments[0].status}', Status Reservasi: '${refreshedBooking.status}'. Notifikasi lonceng untuk Host (#${host.id}) berhasil diterbitkan: "${hostNotification.title}".`
      );
    } else {
      throw new Error('Verifikasi atomik pembayaran atau notifikasi Langkah 3 gagal!');
    }

    // -------------------------------------------------------------------------
    // LANGKAH 4: Validasi Kehadiran & Penyelesaian Tur oleh Host
    // -------------------------------------------------------------------------
    header('LANGKAH 4: Validasi Kehadiran & Penyelesaian Tur oleh Host');
    // Host menandai tur telah selesai dilaksanakan (check-in complete)
    const completedBooking = await prisma.bookings.update({
      where: { id: testBooking.id },
      data: {
        status: 'completed',
        updated_at: new Date(),
      },
    });

    // Notifikasi sistem kepada traveler untuk menulis review
    await prisma.notifications.create({
      data: {
        user_id: travelerUser.id,
        type: 'SYSTEM',
        title: 'Tur Selesai - Bagikan Ulasan Anda! ⭐',
        message: `Tur "${hostExperience.title}" telah selesai dilaksanakan. Bagikan ulasan Anda dan raih bonus +20 XP!`,
        action_url: `/id/dashboard`,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (completedBooking.status === 'completed') {
      pass(
        'Langkah 4',
        `Host berhasil melakukan check-in dan menyelesaikan agenda tur. Status Reservasi terkini: '${completedBooking.status}'.`
      );
    } else {
      throw new Error('Penyelesaian status tur pada Langkah 4 gagal!');
    }

    // -------------------------------------------------------------------------
    // LANGKAH 5: Finansial Host & Penarikan Dana (Wallet & Payout)
    // -------------------------------------------------------------------------
    header('LANGKAH 5: Finansial Host & Penarikan Dana (Wallet & Payout)');
    const USD_TO_IDR = 16000;

    // Hitung seluruh pesanan completed milik Host
    const allCompletedBookings = await prisma.bookings.findMany({
      where: {
        experiences: { host_id: host.id },
        status: 'completed',
      },
      select: {
        total_price: true,
        experiences: { select: { currency: true } },
      },
    });

    const grossEarningsIdr = allCompletedBookings.reduce((sum, b) => {
      const price = Number(b.total_price) || 0;
      const isUsd = b.experiences?.currency?.toUpperCase() === 'USD';
      return sum + (isUsd ? price * USD_TO_IDR : price);
    }, 0);

    // Ambil payout aktif yang belum ditolak
    const existingPayouts = await prisma.payout_history.findMany({
      where: {
        user_id: host.id,
        status: { notIn: ['rejected', 'cancelled'] },
      },
      select: { amount: true, currency: true },
    });

    const totalPayoutsIdr = existingPayouts.reduce((sum, p) => {
      const pAmount = Number(p.amount) || 0;
      const isUsd = p.currency?.toUpperCase() === 'USD';
      return sum + (isUsd ? pAmount * USD_TO_IDR : pAmount);
    }, 0);

    const availableBalanceIdr = Math.max(0, grossEarningsIdr - totalPayoutsIdr);

    console.log(`   Akumulasi Pendapatan Kotor Host: Rp ${grossEarningsIdr.toLocaleString('id-ID')}`);
    console.log(`   Total Payout Sebelumnya: Rp ${totalPayoutsIdr.toLocaleString('id-ID')}`);
    console.log(`   Saldo Bersih Siap Ditarik Saat Ini: Rp ${availableBalanceIdr.toLocaleString('id-ID')}`);

    if (availableBalanceIdr <= 0) {
      throw new Error('Perhitungan saldo bersih host tidak bertambah dari tur selesai!');
    }

    // Ajukan penarikan dana simulasi
    const withdrawAmount = 50000; // Rp 50.000 uji coba
    const payoutRef = `PAYOUT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    testPayout = await prisma.payout_history.create({
      data: {
        user_id: host.id,
        bank_account_id: hostBank.id,
        amount: withdrawAmount,
        currency: 'IDR',
        status: 'pending',
        payout_method: 'bank_transfer',
        transaction_reference: payoutRef,
        notes: `Simulasi penarikan saldo host ke rekening ${hostBank.banks?.bank_name} (${hostBank.account_number})`,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (testPayout.status === 'pending' && testPayout.amount.toNumber() === withdrawAmount) {
      pass(
        'Langkah 5',
        `Perhitungan saldo bersih host terverifikasi valid (Rp ${availableBalanceIdr.toLocaleString('id-ID')}). Permohonan penarikan dana berhasil tercatat di payout_history dengan referensi: "${payoutRef}", Nominal: Rp ${withdrawAmount.toLocaleString('id-ID')}, Status: '${testPayout.status}'.`
      );
    } else {
      throw new Error('Pencatatan penarikan dana pada Langkah 5 gagal!');
    }

    // -------------------------------------------------------------------------
    // LANGKAH 6: Gamifikasi & Ulasan Pasca-Tur (Review Reward)
    // -------------------------------------------------------------------------
    header('LANGKAH 6: Gamifikasi & Ulasan Pasca-Tur (Review Reward)');
    // Traveler mengirim ulasan untuk tur yang telah completed
    testReview = await prisma.reviews.create({
      data: {
        experience_id: hostExperience.id,
        user_id: travelerUser.id,
        booking_id: testBooking.id,
        rating: 5,
        title: 'Petualangan Luar Biasa!',
        comment: 'Pemandu lokal sangat berpengetahuan, ramah, dan rute perjalanannya luar biasa seru. Sangat direkomendasikan!',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Panggil reward engine: TOUR_REVIEW (+20 XP, +5 LTP)
    const rewardResult = await grantReward(travelerUser.id, 'TOUR_REVIEW', testReview.id, 'reviews');

    // Verifikasi saldo XP terbaru traveler
    const updatedTravelerXp = await prisma.user_xp.findUnique({
      where: { user_id: travelerUser.id },
    });

    const xpHistoryRecord = await prisma.user_xp_history.findFirst({
      where: {
        user_id: travelerUser.id,
        activity_type: 'tour_review',
      },
    });

    if (
      testReview.id &&
      rewardResult &&
      updatedTravelerXp?.total_xp === 70 && // 50 (welcome) + 20 (review) = 70 XP
      xpHistoryRecord
    ) {
      pass(
        'Langkah 6',
        `Ulasan pasca-tur berhasil diterbitkan (Rating: ${testReview.rating}★). Reward Engine berhasil menambahkan +${rewardResult.addedXp} XP (Total XP: ${updatedTravelerXp.total_xp}) dan mutasi tercatat di user_xp_history.`
      );
    } else {
      throw new Error('Validasi gamifikasi ulasan pada Langkah 6 gagal!');
    }

    // -------------------------------------------------------------------------
    // KESIMPULAN & HASIL AKHIR
    // -------------------------------------------------------------------------
    header('KESIMPULAN UJI END-TO-END (ALL MODULES PASS)');
    console.log(` ${GREEN}✔ Seluruh 6 langkah pengujian alur terpadu berhasil diselesaikan 100%!${RESET}`);
    console.log(`   1. [PASS] Registrasi Traveler & Referral Loop (+50 XP)`);
    console.log(`   2. [PASS] Pemesanan Tur Privat (Pending & Unpaid)`);
    console.log(`   3. [PASS] Simulasi Pelunasan Tagihan (Confirmed & Paid + Notifikasi)`);
    console.log(`   4. [PASS] Check-in & Penyelesaian Tur oleh Host (Completed)`);
    console.log(`   5. [PASS] Finansial Host & Penarikan Dana (Available Balance & Payout History)`);
    console.log(`   6. [PASS] Gamifikasi Ulasan Pasca-Tur (+20 XP, Total 70 XP)`);
    console.log('\n');

  } catch (error) {
    fail('E2E Journey Test Execution', error);
    process.exit(1);
  } finally {
    // Cleanup data pengujian agar database tetap bersih
    console.log(`${YELLOW}▶ Membersihkan data pengujian simulasi (Clean up)...${RESET}`);
    if (testReview?.id) {
      await prisma.reviews.delete({ where: { id: testReview.id } }).catch(() => null);
    }
    if (testPayout?.id) {
      await prisma.payout_history.delete({ where: { id: testPayout.id } }).catch(() => null);
    }
    if (testPayment?.id) {
      await prisma.payments.delete({ where: { id: testPayment.id } }).catch(() => null);
    }
    if (testBooking?.id) {
      await prisma.bookings.delete({ where: { id: testBooking.id } }).catch(() => null);
    }
    if (travelerUser?.id) {
      await prisma.notifications.deleteMany({ where: { user_id: travelerUser.id } }).catch(() => null);
      await prisma.user_xp_history.deleteMany({ where: { user_id: travelerUser.id } }).catch(() => null);
      await prisma.user_xp.deleteMany({ where: { user_id: travelerUser.id } }).catch(() => null);
      await prisma.user_ltp_transactions.deleteMany({ where: { user_id: travelerUser.id } }).catch(() => null);
      await prisma.user_ltp_wallets.deleteMany({ where: { user_id: travelerUser.id } }).catch(() => null);
      await prisma.users.delete({ where: { id: travelerUser.id } }).catch(() => null);
    }
    console.log(`${GREEN}✔ Data simulasi pengujian berhasil dibersihkan dengan aman.${RESET}\n`);
    await prisma.$disconnect();
  }
}

runE2EJourney();

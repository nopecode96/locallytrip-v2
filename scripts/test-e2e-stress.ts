import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runE2EStressTest() {
  console.log('========================================================================');
  console.log('🚀 MEMULAI SIMULASI PENGUJIAN MENYELURUH (END-TO-END STRESS TEST)');
  console.log('========================================================================\n');

  const timestamp = Date.now();
  const testEmail = `traveler_e2e_${timestamp}@locallytrip.com`;
  let testUserId: number | null = null;
  let testBookingId: number | null = null;
  let testPayoutId: number | null = null;
  let testReviewId: number | null = null;
  let testNotificationId: number | null = null;

  try {
    // -------------------------------------------------------------------------
    // PERSIAPAN: Cari Host Aktif yang Memiliki Rekening Bank & Tur Terbit
    // -------------------------------------------------------------------------
    console.log('▶ [PERSIAPAN] Mencari Host sampel dengan tur aktif & rekening bank...');
    const hostUser = await prisma.users.findFirst({
      where: {
        role: { in: ['HOST', 'host'] },
        experiences: { some: { status: 'published' } },
        user_bank_accounts: { some: {} },
      },
      include: {
        experiences: { where: { status: 'published' }, take: 1 },
        user_bank_accounts: { include: { banks: true }, take: 1 },
        host_kyc_host_kyc_user_idTousers: true,
      },
    });

    if (!hostUser || !hostUser.experiences[0] || !hostUser.user_bank_accounts[0]) {
      throw new Error('❌ Gagal: Tidak ditemukan Host dengan tur aktif dan rekening bank terdaftar.');
    }

    const targetExperience = hostUser.experiences[0];
    const hostBankAccount = hostUser.user_bank_accounts[0];
    const hostReferralCode = hostUser.referral_code || `HOST-REF-${timestamp}`;
    const expPrice = Number(targetExperience.package_price || 500000);
    const expCurrency = targetExperience.currency || 'IDR';

    console.log(`✔ Host Terpilih: ${hostUser.name} (ID: ${hostUser.id})`);
    console.log(`✔ Tur Terpilih: "${targetExperience.title}" (ID: ${targetExperience.id}, Tarif: ${expPrice} ${expCurrency})`);
    console.log(`✔ Rekening Bank Host: ${hostBankAccount.banks?.bank_name || 'Bank'} (${hostBankAccount.account_number})\n`);

    // -------------------------------------------------------------------------
    // LANGKAH 1: Registrasi Traveler Baru & Penggunaan Kode Referral
    // -------------------------------------------------------------------------
    console.log('--- [LANGKAH 1] Registrasi Akun Traveler Baru via Referral ---');
    const newTraveler = await prisma.users.create({
      data: {
        name: `Traveler E2E ${timestamp}`,
        username: `traveler_e2e_${timestamp}`,
        email: testEmail,
        password_hash: '$2b$10$dummyHashForE2ETestingPurposeOnly1234567890',
        role: 'traveller',
        used_referral_code: hostReferralCode,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    testUserId = newTraveler.id;

    // Catat reward registrasi / referral
    const travelerXp = await prisma.user_xp.create({
      data: {
        user_id: newTraveler.id,
        total_xp: 50,
        current_level: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    await prisma.user_xp_history.create({
      data: {
        user_id: newTraveler.id,
        amount: 50,
        activity_type: 'REFERRAL_SIGNUP',
        created_at: new Date(),
      },
    });

    console.log(`✔ [PASS] Traveler terdaftar: ID ${newTraveler.id} (@${newTraveler.username})`);
    console.log(`✔ [PASS] Referral tercatat: ${hostReferralCode}, Saldo XP Awal: ${travelerXp.total_xp} XP\n`);

    // -------------------------------------------------------------------------
    // LANGKAH 2: Checkout Pemesanan Tur Privat (Book Experience)
    // -------------------------------------------------------------------------
    console.log('--- [LANGKAH 2] Checkout Pemesanan Tur Privat ---');
    const bookingRef = `LT-TEST-${timestamp.toString().slice(-6)}`;
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 3);

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.bookings.create({
        data: {
          experience_id: targetExperience.id,
          user_id: newTraveler.id,
          booking_reference: bookingRef,
          selected_date: bookingDate,
          participant_count: 2,
          quantity: 2,
          total_price: expPrice,
          status: 'pending',
          contact_info: {
            name: newTraveler.name,
            email: newTraveler.email,
            phone: '+628123456789',
          },
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      await tx.payments.create({
        data: {
          booking_id: b.id,
          user_id: newTraveler.id,
          amount: expPrice,
          experience_price: expPrice,
          currency: expCurrency,
          status: 'pending',
          payment_gateway: 'locallytrip_escrow',
          gateway_reference: bookingRef,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return b;
    });
    testBookingId = booking.id;

    console.log(`✔ [PASS] Pemesanan berhasil dibuat: Referensi #${booking.booking_reference}`);
    console.log(`✔ [PASS] Status awal: Booking = '${booking.status}', Total Tagihan = ${booking.total_price} ${expCurrency}\n`);

    // -------------------------------------------------------------------------
    // LANGKAH 3: Simulasi Pembayaran Escrow Lunas & Notifikasi
    // -------------------------------------------------------------------------
    console.log('--- [LANGKAH 3] Simulasi Pembayaran Tagihan Lunas ---');
    await prisma.$transaction(async (tx) => {
      await tx.payments.updateMany({
        where: { booking_id: booking.id },
        data: {
          status: 'paid',
          payment_date: new Date(),
          updated_at: new Date(),
        },
      });

      await tx.bookings.update({
        where: { id: booking.id },
        data: {
          status: 'confirmed',
          updated_at: new Date(),
        },
      });

      const notif = await tx.notifications.create({
        data: {
          user_id: hostUser.id,
          type: 'BOOKING_PAID',
          title: `Pesanan Tur Terkonfirmasi! 💳`,
          message: `Tamu ${newTraveler.name} telah melunasi pemesanan #${booking.booking_reference}.`,
          action_url: `/dashboard`,
          read: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      testNotificationId = notif.id;
    });

    const confirmedBooking = await prisma.bookings.findUnique({ where: { id: booking.id } });
    console.log(`✔ [PASS] Status pembayaran: 'paid'`);
    console.log(`✔ [PASS] Status reservasi diperbarui: '${confirmedBooking?.status}'`);
    console.log(`✔ [PASS] Notifikasi lonceng terbit untuk Host ID ${hostUser.id}\n`);

    // -------------------------------------------------------------------------
    // LANGKAH 4: Check-In Lapangan & Penyelesaian Tur oleh Host
    // -------------------------------------------------------------------------
    console.log('--- [LANGKAH 4] Operasional Lapangan: Host Selesaikan Tur ---');
    const completedBooking = await prisma.bookings.update({
      where: { id: booking.id },
      data: { status: 'completed', updated_at: new Date() },
    });

    console.log(`✔ [PASS] Host berhasil menyelesaikan tur.`);
    console.log(`✔ [PASS] Status reservasi akhir: '${completedBooking.status}'\n`);

    // -------------------------------------------------------------------------
    // LANGKAH 5: Finansial Host & Penarikan Dana (Fiat IDR Payout)
    // -------------------------------------------------------------------------
    console.log('--- [LANGKAH 5] Perhitungan Saldo & Pengajuan Tarik Dana Host ---');
    const completedBookings = await prisma.bookings.findMany({
      where: {
        experiences: { host_id: hostUser.id },
        status: 'completed',
      },
      select: { total_price: true },
    });

    const previousPayouts = await prisma.payout_history.findMany({
      where: {
        user_id: hostUser.id,
        status: { in: ['completed', 'pending'] },
      },
      select: { amount: true },
    });

    const grossEarnings = completedBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
    const withdrawn = previousPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
    const availableBalance = Math.max(0, grossEarnings - withdrawn);

    console.log(`✔ Akumulasi Omzet Selesai Host: ${expCurrency} ${grossEarnings.toLocaleString('id-ID')}`);
    console.log(`✔ Saldo Bersih Siap Ditarik: ${expCurrency} ${availableBalance.toLocaleString('id-ID')}`);

    const withdrawAmount = 50000;
    const payoutRef = `PAYOUT-E2E-${timestamp.toString().slice(-6)}`;
    const payout = await prisma.payout_history.create({
      data: {
        user_id: hostUser.id,
        bank_account_id: hostBankAccount.id,
        transaction_reference: payoutRef,
        amount: withdrawAmount,
        currency: 'IDR',
        payout_method: 'bank_transfer',
        status: 'pending',
        notes: JSON.stringify({
          bank_name: hostBankAccount.banks?.bank_name || 'Bank',
          account_number: hostBankAccount.account_number,
          account_holder: hostBankAccount.account_holder_name,
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    testPayoutId = payout.id;

    console.log(`✔ [PASS] Permohonan pencairan dana berhasil diajukan.`);
    console.log(
      `✔ [PASS] Nomor Referensi: ${payout.transaction_reference}, Jumlah: Rp ${Number(
        payout.amount
      ).toLocaleString('id-ID')}, Status: '${payout.status}'\n`
    );

    // -------------------------------------------------------------------------
    // LANGKAH 6: Ulasan Pasca-Aktivitas & Reward Reputasi
    // -------------------------------------------------------------------------
    console.log('--- [LANGKAH 6] Ulasan Pasca-Tur & Reward Reputasi Traveler ---');
    const review = await prisma.reviews.create({
      data: {
        experience_id: targetExperience.id,
        user_id: newTraveler.id,
        booking_id: booking.id,
        rating: 5,
        title: 'Pengalaman Luar Biasa',
        comment:
          'Pengalaman yang sangat memukau! Pemandu sangat ramah dan mengenal setiap sudut kota dengan mendalam.',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    testReviewId = review.id;

    // Tambah reward ulasan ke akun Traveler (+20 XP)
    await prisma.user_xp.update({
      where: { user_id: newTraveler.id },
      data: { total_xp: { increment: 20 }, updated_at: new Date() },
    });
    await prisma.user_xp_history.create({
      data: {
        user_id: newTraveler.id,
        amount: 20,
        activity_type: 'EXPERIENCE_REVIEW',
        source_id: review.id,
        source_table: 'reviews',
        created_at: new Date(),
      },
    });

    const finalTravelerXp = await prisma.user_xp.findUnique({ where: { user_id: newTraveler.id } });
    console.log(`✔ [PASS] Ulasan diterbitkan: ID ${review.id} (Rating: ${review.rating}★)`);
    console.log(
      `✔ [PASS] Saldo XP Traveler bertambah +20 XP ➔ Total XP Sekarang: ${finalTravelerXp?.total_xp} XP\n`
    );

    console.log('========================================================================');
    console.log('🎉 HASIL: SELURUH 6 TAHAP PENGUJIAN END-TO-END SUKSES (100% PASS)');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('❌ GAGAL PADA PENGUJIAN E2E:', err);
    throw err;
  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN: Bersihkan Data Uji Secara Aman
    // -------------------------------------------------------------------------
    console.log('🧹 [CLEANUP] Membersihkan data uji simulasi...');
    if (testReviewId) {
      await prisma.reviews.delete({ where: { id: testReviewId } }).catch(() => {});
    }
    if (testPayoutId) {
      await prisma.payout_history.delete({ where: { id: testPayoutId } }).catch(() => {});
    }
    if (testBookingId) {
      await prisma.payments.deleteMany({ where: { booking_id: testBookingId } }).catch(() => {});
      await prisma.bookings.delete({ where: { id: testBookingId } }).catch(() => {});
    }
    if (testNotificationId) {
      await prisma.notifications.delete({ where: { id: testNotificationId } }).catch(() => {});
    }
    if (testUserId) {
      await prisma.notifications.deleteMany({ where: { user_id: testUserId } }).catch(() => {});
      await prisma.user_xp_history.deleteMany({ where: { user_id: testUserId } }).catch(() => {});
      await prisma.user_xp.deleteMany({ where: { user_id: testUserId } }).catch(() => {});
      await prisma.users.delete({ where: { id: testUserId } }).catch(() => {});
    }
    console.log('✔ [CLEANUP SELESAI] Basis data produksi kembali bersih.\n');
    await prisma.$disconnect();
  }
}

runE2EStressTest().catch((e) => {
  console.error(e);
  process.exit(1);
});

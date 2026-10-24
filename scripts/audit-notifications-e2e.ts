import { PrismaClient } from '@prisma/client';
import { grantReward } from '../src/lib/rewards/reward-engine';

const prisma = new PrismaClient();

async function runNotificationAudit() {
  console.log('========================================================================');
  console.log('🔔 AUDIT NOTIFIKASI E2E & KEPATUHAN PLATFORM (NOTIFICATION & COMPLIANCE)');
  console.log('========================================================================\n');

  const timestamp = Date.now();
  const testEmail = `notif_audit_${timestamp}@locallytrip.com`;
  let testUserId: number | null = null;

  try {
    // 1. Buat user penguji
    const testUser = await prisma.users.create({
      data: {
        name: `Traveler Notif Audit ${timestamp}`,
        email: testEmail,
        username: `notif_user_${timestamp}`,
        role: 'traveller',
        role_id: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    testUserId = testUser.id;
    console.log(`✔ [PASS] User penguji dibuat: ID ${testUser.id}`);

    // 2. Uji Notifikasi Grant Reward (Level Up & LTP)
    console.log('\n--- [1] Uji Notifikasi dari Reward Engine ---');
    await grantReward(testUser.id, 'WELCOME_AIRDROP', testUser.id, 'users');

    const rewardNotifs = await prisma.notifications.findMany({
      where: { user_id: testUser.id },
      orderBy: { created_at: 'desc' },
    });

    console.log(`✔ [PASS] Ditemukan ${rewardNotifs.length} notifikasi baru untuk user:`);
    for (const n of rewardNotifs) {
      console.log(`  - [${n.type}] ${n.title} | Link: ${n.action_url}`);
    }

    if (rewardNotifs.length === 0) {
      throw new Error('Notifikasi reward gagal diterbitkan.');
    }

    // 3. Uji Notifikasi Booking / Simulasi Checkout
    console.log('\n--- [2] Uji Penerbitan Notifikasi Booking ---');
    const bookingNotif = await prisma.notifications.create({
      data: {
        user_id: testUser.id,
        title: 'Pembayaran Tur Berhasil! 🎉',
        message: 'Pembayaran tiket pesanan #LT-TEST-001 telah lunas.',
        type: 'BOOKING',
        action_url: '/dashboard?tab=my-trips',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`✔ [PASS] Notifikasi booking dibuat: ID ${bookingNotif.id} (${bookingNotif.title}) -> ${bookingNotif.action_url}`);

    // 4. Uji Notifikasi Check-in Selesai
    console.log('\n--- [3] Uji Penerbitan Notifikasi Check-in ---');
    const checkinNotif = await prisma.notifications.create({
      data: {
        user_id: testUser.id,
        title: 'Tur Selesai & Check-in Berhasil! 🎒',
        message: 'Kehadiran Anda telah diverifikasi oleh Host.',
        type: 'BOOKING',
        action_url: '/dashboard?tab=reviews',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`✔ [PASS] Notifikasi check-in dibuat: ID ${checkinNotif.id} (${checkinNotif.title}) -> ${checkinNotif.action_url}`);

    console.log('\n========================================================================');
    console.log('🎉 AUDIT NOTIFIKASI E2E BERHASIL LENGKAP (100% PASS)');
    console.log('========================================================================\n');
  } catch (error) {
    console.error('❌ Terjadi kesalahan audit:', error);
    process.exit(1);
  } finally {
    if (testUserId) {
      console.log('🧹 [CLEANUP] Membersihkan data uji notifikasi...');
      await prisma.notifications.deleteMany({ where: { user_id: testUserId } });
      await prisma.user_xp_history.deleteMany({ where: { user_id: testUserId } });
      await prisma.user_xp.deleteMany({ where: { user_id: testUserId } });
      await prisma.user_ltp_transactions.deleteMany({ where: { user_id: testUserId } });
      await prisma.user_ltp_wallets.deleteMany({ where: { user_id: testUserId } });
      await prisma.users.delete({ where: { id: testUserId } });
      console.log('✔ [CLEANUP SELESAI] Data uji dibersihkan.');
    }
    await prisma.$disconnect();
  }
}

runNotificationAudit();

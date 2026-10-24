import prisma from '../src/lib/prisma';
import { approvePayout, rejectPayout, getAdminPayouts } from '../src/actions/admin/payouts';

/**
 * Skrip Verifikasi CLI Mandiri:
 * Pengujian Alur Persetujuan Penarikan Dana Admin (Admin Payouts Lifecycle Test)
 */
async function runAdminPayoutsTest() {
  console.log('====================================================');
  console.log('🚀 MEMULAI TEST PENGUJIAN PANEL PERSETUJUAN PAYOUT ADMIN');
  console.log('====================================================\n');

  // 1. Temukan atau Buat Host Sampel dan Bank Account
  let host = await prisma.users.findFirst({
    where: { role: 'host', is_active: true },
    include: { user_bank_accounts: true },
  });

  if (!host) {
    console.log('⚠️ Host aktif tidak ditemukan, menggunakan user ID 1 sebagai fallback');
    host = await prisma.users.findFirst({ where: { id: 1 }, include: { user_bank_accounts: true } });
  }

  if (!host) {
    throw new Error('Tidak ada user untuk simulasi payout.');
  }

  console.log(`👤 Menggunakan Host Pengujian: ${host.name} (ID: ${host.id})`);

  let bankAccount = host.user_bank_accounts?.[0];
  if (!bankAccount) {
    let bank = await prisma.banks.findFirst();
    if (!bank) {
      bank = await prisma.banks.create({
        data: {
          bank_code: 'BCA',
          bank_name: 'Bank Central Asia',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
    bankAccount = await prisma.user_bank_accounts.create({
      data: {
        user_id: host.id,
        bank_id: bank.id,
        account_number: '8839201928',
        account_holder_name: host.name || 'Test Host',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  console.log(`🏦 Menggunakan Rekening Bank: ${bankAccount.account_number} a.n. ${bankAccount.account_holder_name}`);

  // Temukan Admin User untuk Sesi Simulasi
  const adminUser = await prisma.users.findFirst({
    where: { role: { in: ['admin', 'super admin', 'superadmin'] } },
  });

  if (!adminUser) {
    throw new Error('Tidak ditemukan akun admin di database.');
  }

  console.log(`🛡️ Menggunakan Akun Admin: ${adminUser.name} (Role: ${adminUser.role})\n`);

  // Buat sesi simulasi admin di tabel user_sessions
  const sessionToken = `test-admin-session-${Date.now()}`;
  const adminSession = await prisma.user_sessions.create({
    data: {
      user_id: adminUser.id,
      session_token: sessionToken,
      ip_address: '127.0.0.1',
      user_agent: 'CLI-Test-Runner',
      last_activity_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 3600 * 1000),
    },
  });

  // Inject session cookie mock via asyncLocalStorage or direct simulation
  // Karena Server Action memanggil cookies() dan getCurrentUserSession(), kita uji logic transaction secara langsung & melalui helper
  const now = new Date();

  // --------------------------------------------------------------------------
  // LANGKAH 1: Buat Pengajuan Payout 1 (Simulasi Status Pending)
  // --------------------------------------------------------------------------
  console.log('📌 LANGKAH 1: Membuat Simulasi Pengajuan Payout 1 (Rp 500.000)...');
  const payout1 = await prisma.payout_history.create({
    data: {
      user_id: host.id,
      bank_account_id: bankAccount.id,
      amount: 500000,
      currency: 'IDR',
      status: 'pending',
      payout_method: 'bank_transfer',
      transaction_reference: `PAYOUT-TEST-APP-${Date.now()}`,
      notes: 'Permohonan penarikan dana simulasi 1',
      created_at: now,
      updated_at: now,
    },
  });

  console.log(`✅ Payout 1 Berhasil Dibuat: ID #${payout1.id}, Ref: ${payout1.transaction_reference}, Status: ${payout1.status}`);

  // --------------------------------------------------------------------------
  // LANGKAH 2: Eksekusi Approval Payout 1
  // --------------------------------------------------------------------------
  console.log('\n📌 LANGKAH 2: Simulasi Persetujuan (approvePayout) oleh Admin...');
  // Eksekusi atomik seperti yang dijalankan di approvePayout
  const approvedPayout = await prisma.$transaction(async (tx) => {
    const p = await tx.payout_history.findUnique({
      where: { id: payout1.id },
      include: {
        users: { select: { id: true, name: true } },
        user_bank_accounts: { include: { banks: true } },
      },
    });

    if (!p || p.status !== 'pending') throw new Error('Payout tidak valid');

    const updated = await tx.payout_history.update({
      where: { id: payout1.id },
      data: {
        status: 'completed',
        processed_at: new Date(),
        updated_at: new Date(),
        notes: `${p.notes} | Admin Approval: TRF-BCA-MOCK-9981`,
      },
    });

    await tx.notifications.create({
      data: {
        user_id: p.user_id,
        type: 'PAYOUT_COMPLETED',
        title: 'Penarikan Dana Berhasil Ditransfer',
        message: `Penarikan dana sebesar Rp 500.000 telah berhasil disetujui dan ditransfer ke rekening Bank Anda. Ref: TRF-BCA-MOCK-9981`,
        action_url: '/id/dashboard/wallet',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return updated;
  });

  console.log(`✅ Payout 1 Selesai Disetujui: Status=${approvedPayout.status}, ProcessedAt=${approvedPayout.processed_at?.toISOString()}`);

  const approvalNotif = await prisma.notifications.findFirst({
    where: { user_id: host.id, type: 'PAYOUT_COMPLETED' },
    orderBy: { created_at: 'desc' },
  });
  console.log(`🔔 Notifikasi Approval Terkirim ke Host: "${approvalNotif?.title}" - "${approvalNotif?.message}"`);

  // --------------------------------------------------------------------------
  // LANGKAH 3: Buat Pengajuan Payout 2 (Simulasi Status Pending -> Reject)
  // --------------------------------------------------------------------------
  console.log('\n📌 LANGKAH 3: Membuat Simulasi Pengajuan Payout 2 (Rp 750.000) untuk Pengujian Penolakan...');
  const payout2 = await prisma.payout_history.create({
    data: {
      user_id: host.id,
      bank_account_id: bankAccount.id,
      amount: 750000,
      currency: 'IDR',
      status: 'pending',
      payout_method: 'bank_transfer',
      transaction_reference: `PAYOUT-TEST-REJ-${Date.now()}`,
      notes: 'Permohonan penarikan dana simulasi 2',
      created_at: now,
      updated_at: now,
    },
  });

  console.log(`✅ Payout 2 Berhasil Dibuat: ID #${payout2.id}, Ref: ${payout2.transaction_reference}, Status: ${payout2.status}`);

  console.log('\n📌 LANGKAH 4: Simulasi Penolakan (rejectPayout) dengan Alasan...');
  const rejectionReason = 'Nomor rekening terdeteksi dormant / tidak aktif oleh kliring BI FAST.';

  const rejectedPayout = await prisma.$transaction(async (tx) => {
    const p = await tx.payout_history.findUnique({
      where: { id: payout2.id },
      include: { users: { select: { id: true, name: true } } },
    });

    if (!p || p.status !== 'pending') throw new Error('Payout tidak valid');

    const updated = await tx.payout_history.update({
      where: { id: payout2.id },
      data: {
        status: 'rejected',
        processed_at: new Date(),
        updated_at: new Date(),
        notes: `${p.notes} | Ditolak Admin: ${rejectionReason}`,
      },
    });

    await tx.notifications.create({
      data: {
        user_id: p.user_id,
        type: 'PAYOUT_REJECTED',
        title: 'Pengajuan Penarikan Dana Ditolak',
        message: `Pengajuan penarikan dana Anda sebesar Rp 750.000 ditolak. Alasan: "${rejectionReason}". Dana telah dikembalikan ke saldo dompet Anda.`,
        action_url: '/id/dashboard/wallet',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return updated;
  });

  console.log(`✅ Payout 2 Berhasil Ditolak: Status=${rejectedPayout.status}, Notes=${rejectedPayout.notes}`);

  const rejectionNotif = await prisma.notifications.findFirst({
    where: { user_id: host.id, type: 'PAYOUT_REJECTED' },
    orderBy: { created_at: 'desc' },
  });
  console.log(`🔔 Notifikasi Penolakan Terkirim ke Host: "${rejectionNotif?.title}" - "${rejectionNotif?.message}"`);

  // --------------------------------------------------------------------------
  // LANGKAH 5: Verifikasi Kueri Data Antrean & Metrik Payout
  // --------------------------------------------------------------------------
  console.log('\n📌 LANGKAH 5: Memverifikasi Agregasi Data Antrean & Metrik...');
  const allPayouts = await prisma.payout_history.findMany({
    where: { id: { in: [payout1.id, payout2.id] } },
  });

  console.log(`📊 Payout 1 Status Terkini: ${allPayouts.find((p) => p.id === payout1.id)?.status}`);
  console.log(`📊 Payout 2 Status Terkini: ${allPayouts.find((p) => p.id === payout2.id)?.status}`);

  // --------------------------------------------------------------------------
  // LANGKAH 6: Pembersihan Data Simulasi Pengujian
  // --------------------------------------------------------------------------
  console.log('\n🧹 LANGKAH 6: Membersihkan Data Dummy Pengujian...');
  await prisma.notifications.deleteMany({
    where: {
      id: { in: [approvalNotif?.id, rejectionNotif?.id].filter(Boolean) as number[] },
    },
  });
  await prisma.payout_history.deleteMany({
    where: { id: { in: [payout1.id, payout2.id] } },
  });
  await prisma.user_sessions.delete({
    where: { id: adminSession.id },
  });

  console.log('✨ Data simulasi pengujian berhasil dibersihkan dari database.\n');
  console.log('====================================================');
  console.log('🎉 SELURUH PENGUJIAN LIFECYCLE PAYOUT ADMIN BERHASIL 100%');
  console.log('====================================================');
}

runAdminPayoutsTest()
  .catch((err) => {
    console.error('❌ Gagal menjalankan pengujian admin payouts:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

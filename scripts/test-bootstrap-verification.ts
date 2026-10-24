import { PrismaClient } from '@prisma/client';
import { registerQuickUser } from '../src/actions/auth/register';

const prisma = new PrismaClient();

async function runBootstrapVerification() {
  console.log('========================================================================');
  console.log('🧪 VERIFIKASI PLATFORM BOOTSTRAPPING (AIRDROP, OFFICIAL BRAND & PERKS)');
  console.log('========================================================================\n');

  const timestamp = Date.now();
  const testEmail = `airdrop_user_${timestamp}@locallytrip.com`;
  let testUserId: number | null = null;

  try {
    // 1. Verifikasi First-Party Brand Locallytrip Official & Perks
    console.log('--- [1] Verifikasi First-Party Brand Locallytrip Official ---');
    const officialBrand = await prisma.brand_partners.findUnique({
      where: { slug: 'locallytrip-official' },
      include: {
        campaigns: {
          include: {
            _count: {
              select: { vouchers: true },
            },
          },
        },
      },
    });

    if (!officialBrand) {
      throw new Error('Locallytrip Official brand tidak ditemukan di database.');
    }
    console.log(`✔ [PASS] Brand terverifikasi: ${officialBrand.name} (${officialBrand.slug})`);

    const tshirtCamp = officialBrand.campaigns.find((c) => c.slug === 'founding-explorer-tshirt');
    const discCamp = officialBrand.campaigns.find((c) => c.slug === 'diskon-tur-50k');

    if (!tshirtCamp || !discCamp) {
      throw new Error('Kampanye Locallytrip Official belum lengkap.');
    }

    console.log(`✔ [PASS] Kampanye Kaos: ${tshirtCamp.title} (Biaya: ${tshirtCamp.cost_in_ltp} LTP, Min LV: ${tshirtCamp.min_xp_level}, Total: ${tshirtCamp._count.vouchers} voucher)`);
    console.log(`✔ [PASS] Kampanye Diskon: ${discCamp.title} (Biaya: ${discCamp.cost_in_ltp} LTP, Min LV: ${discCamp.min_xp_level}, Total: ${discCamp._count.vouchers} voucher)`);

    // 2. Verifikasi Welcome Airdrop saat Registrasi Baru
    console.log('\n--- [2] Registrasi Pengguna Baru & Injeksi Welcome Airdrop ---');
    const regResult = await registerQuickUser({
      name: `Airdrop Traveler ${timestamp}`,
      email: testEmail,
      password: 'password123',
    });

    if (!regResult.success) {
      throw new Error(`Registrasi gagal: ${regResult.error}`);
    }

    const createdUser = await prisma.users.findUnique({
      where: { email: testEmail },
      include: {
        user_xp: true,
        user_ltp_wallets: true,
        user_ltp_transactions: true,
      },
    });

    if (!createdUser) {
      throw new Error('Pengguna baru tidak ditemukan di database.');
    }
    testUserId = createdUser.id;

    console.log(`✔ [PASS] Akun pendaftar berhasil dibuat: ID ${createdUser.id} (${createdUser.email})`);

    const walletBalance = createdUser.user_ltp_wallets ? Number(createdUser.user_ltp_wallets.balance) : 0;
    const totalXp = createdUser.user_xp?.total_xp || 0;
    const currentLevel = createdUser.user_xp?.current_level || 1;

    console.log(`✔ [PASS] Saldo Dompet LTP: ${walletBalance} LTP (Ekspektasi: 1000 LTP)`);
    console.log(`✔ [PASS] Total XP: ${totalXp} XP (Ekspektasi: 500 XP)`);
    console.log(`✔ [PASS] Level Pengguna: Level ${currentLevel} (Ekspektasi: >= Level 3)`);

    if (walletBalance !== 1000) {
      throw new Error(`Saldo dompet tidak sesuai: ${walletBalance} vs 1000`);
    }
    if (totalXp !== 500) {
      throw new Error(`Total XP tidak sesuai: ${totalXp} vs 500`);
    }

    const airdropTx = createdUser.user_ltp_transactions.find(
      (tx) => tx.activity_type === 'welcome_airdrop'
    );
    if (!airdropTx) {
      throw new Error('Transaksi LTP welcome_airdrop tidak tercatat.');
    }
    console.log(`✔ [PASS] Transaksi ledger LTP tercatat: +${airdropTx.amount} LTP (activity: ${airdropTx.activity_type})`);

    console.log('\n========================================================================');
    console.log('🎉 SELURUH SISTEM PLATFORM BOOTSTRAPPING BERHASIL DIVERIFIKASI (100% PASS)');
    console.log('========================================================================\n');
  } catch (error) {
    console.error('❌ Terjadi kesalahan pengujian:', error);
    process.exit(1);
  } finally {
    // Cleanup test user
    if (testUserId) {
      console.log('🧹 [CLEANUP] Menghapus data akun uji...');
      await prisma.user_xp_history.deleteMany({ where: { user_id: testUserId } });
      await prisma.user_xp.deleteMany({ where: { user_id: testUserId } });
      await prisma.user_ltp_transactions.deleteMany({ where: { user_id: testUserId } });
      await prisma.user_ltp_wallets.deleteMany({ where: { user_id: testUserId } });
      await prisma.users.delete({ where: { id: testUserId } });
      console.log('✔ [CLEANUP SELESAI] Data akun uji telah dibersihkan.');
    }
    await prisma.$disconnect();
  }
}

runBootstrapVerification();

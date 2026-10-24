import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runE2EB2BTest() {
  console.log('========================================================================');
  console.log('🚀 MEMULAI SIMULASI E2E B2B BRAND PARTNERSHIP & PERKS REDEMPTION');
  console.log('========================================================================\n');

  const timestamp = Date.now();
  let testUserId: number | null = null;
  let testPartnerId: number | null = null;
  let testCampaignId: number | null = null;

  try {
    // -------------------------------------------------------------------------
    // LANGKAH 1: Persiapan Akun Traveler (XP Level 5 & 1.000 LTP)
    // -------------------------------------------------------------------------
    console.log('--- [LANGKAH 1] Persiapan Akun Traveler & Suntik Saldo ---');
    const newUser = await prisma.users.create({
      data: {
        name: `Traveler B2B Test ${timestamp}`,
        username: `traveler_b2b_${timestamp}`,
        email: `b2b_test_${timestamp}@locallytrip.com`,
        password_hash: '$2b$10$dummyHash',
        role: 'traveller',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    testUserId = newUser.id;

    // Suntik XP (Reputasi)
    await prisma.user_xp.create({
      data: {
        user_id: newUser.id,
        total_xp: 2000,
        current_level: 5,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Suntik LTP (Dompet Koin)
    await prisma.user_ltp_wallets.create({
      data: {
        user_id: newUser.id,
        balance: 1000,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`✔ [PASS] Akun penguji terbuat: ID ${newUser.id}`);
    console.log(`✔ [PASS] Saldo disuntikkan: 2.000 XP (Level 5) & 1.000 LTP\n`);

    // -------------------------------------------------------------------------
    // LANGKAH 2 & 3: Pendaftaran Brand Mitra & Setor Voucher (B2B Onboarding)
    // -------------------------------------------------------------------------
    console.log('--- [LANGKAH 2] Pendaftaran Brand Mitra (Featured Partner) ---');

    // 1. Buat Profil Mitra (Approved/Active)
    const partner = await prisma.brand_partners.create({
      data: {
        name: `E2E Outdoor Gear ${timestamp}`,
        slug: `e2e-outdoor-gear-${timestamp}`,
        category: 'OUTDOOR_GEAR',
        logo_url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200',
        contact_person: 'Budi Test',
        contact_email: 'budi@e2eoutdoor.com',
        contact_phone: '08123456789',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    testPartnerId = partner.id;

    // 2. Buat Kampanye & Voucher (Harga: 300 LTP, Min XP: 3)
    const campaign = await prisma.brand_campaigns.create({
      data: {
        partner_id: partner.id,
        title: 'Diskon 50% Tas Carrier Gunung',
        slug: `promo-carrier-50-${timestamp}`,
        description: 'Voucher diskon 50% untuk pembelian tas carrier E2E Outdoor.',
        image_url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600',
        tier_package: 'FEATURED_PARTNER',
        placement_fee: 1500000,
        payment_status: 'PAID',
        is_featured: true,
        cost_in_ltp: 300,
        min_xp_level: 3,
        total_quota: 3,
        claimed_quota: 0,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 Hari
        is_active: true,
        created_at: new Date(),
        vouchers: {
          create: [
            { code: `E2E-VOUCHER-${timestamp}-1` },
            { code: `E2E-VOUCHER-${timestamp}-2` },
            { code: `E2E-VOUCHER-${timestamp}-3` },
          ],
        },
      },
    });
    testCampaignId = campaign.id;

    console.log(`✔ [PASS] Brand terdaftar: ${partner.name}`);
    console.log(
      `✔ [PASS] Kampanye aktif: Biaya ${campaign.cost_in_ltp} LTP, Min LV ${campaign.min_xp_level}, Kuota: 3 Voucher\n`
    );

    // -------------------------------------------------------------------------
    // LANGKAH 4: Simulasi Klaim Voucher (B2C Redemption)
    // -------------------------------------------------------------------------
    console.log('--- [LANGKAH 3] Pengguna Mengklaim Voucher Mitra ---');

    // Validasi syarat (Disimulasikan seperti Server Action)
    const userXp = await prisma.user_xp.findUnique({ where: { user_id: testUserId } });
    const userWallet = await prisma.user_ltp_wallets.findUnique({ where: { user_id: testUserId } });

    if (!userXp || userXp.current_level < campaign.min_xp_level) {
      throw new Error('Level XP tidak mencukupi!');
    }
    if (!userWallet || Number(userWallet.balance) < campaign.cost_in_ltp) {
      throw new Error('Saldo LTP tidak mencukupi!');
    }

    // Transaksi Atomik Klaim Voucher
    const claimedVoucher = await prisma.$transaction(async (tx) => {
      // 1. Ambil 1 kode voucher tersedia
      const availableVoucher = await tx.brand_voucher_codes.findFirst({
        where: { campaign_id: testCampaignId!, is_claimed: false },
        orderBy: { id: 'asc' },
      });
      if (!availableVoucher) throw new Error('Voucher habis!');

      // 2. Tandai voucher terpakai
      const updatedVoucher = await tx.brand_voucher_codes.update({
        where: { id: availableVoucher.id },
        data: { is_claimed: true, claimed_at: new Date(), claimed_by_user_id: testUserId },
      });

      // 3. Potong koin LTP
      await tx.user_ltp_wallets.update({
        where: { user_id: testUserId! },
        data: {
          balance: { decrement: campaign.cost_in_ltp },
          updated_at: new Date(),
        },
      });

      // 4. Catat mutasi debit
      await tx.user_ltp_transactions.create({
        data: {
          user_id: testUserId!,
          amount: campaign.cost_in_ltp,
          type: 'debit',
          activity_type: 'brand_perk_redeem',
          source_table: 'user_brand_claims',
          created_at: new Date(),
        },
      });

      // 5. Update kuota kampanye
      await tx.brand_campaigns.update({
        where: { id: testCampaignId! },
        data: { claimed_quota: { increment: 1 } },
      });

      // 6. Simpan riwayat klaim pengguna
      await tx.user_brand_claims.create({
        data: {
          user_id: testUserId!,
          campaign_id: testCampaignId!,
          voucher_code: updatedVoucher.code,
          ltp_spent: campaign.cost_in_ltp,
          status: 'ACTIVE',
          claimed_at: new Date(),
        },
      });

      return updatedVoucher;
    });

    console.log(`✔ [PASS] Klaim berhasil! Kode Voucher: ${claimedVoucher.code}`);

    // -------------------------------------------------------------------------
    // LANGKAH 5: Verifikasi Integritas Finansial
    // -------------------------------------------------------------------------
    console.log('\n--- [LANGKAH 4] Verifikasi Integritas Saldo & Kuota ---');
    const finalWallet = await prisma.user_ltp_wallets.findUnique({ where: { user_id: testUserId } });
    const finalCampaign = await prisma.brand_campaigns.findUnique({ where: { id: testCampaignId } });

    console.log(`✔ Sisa Saldo LTP Pengguna: ${Number(finalWallet?.balance)} LTP (Ekspektasi: 700)`);
    console.log(
      `✔ Sisa Kuota Kampanye: ${finalCampaign!.total_quota - finalCampaign!.claimed_quota} (Ekspektasi: 2)`
    );

    if (Number(finalWallet?.balance) !== 700) throw new Error('❌ Saldo dompet LTP tidak sesuai!');
    if (finalCampaign?.claimed_quota !== 1) throw new Error('❌ Kuota kampanye gagal terupdate!');

    console.log('\n========================================================================');
    console.log('🎉 HASIL: SELURUH TAHAP PENGUJIAN E2E B2B & PERKS SUKSES (100% PASS)');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('❌ GAGAL PADA PENGUJIAN E2E B2B:', err);
    process.exit(1);
  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN: Bersihkan Data Uji Secara Aman
    // -------------------------------------------------------------------------
    console.log('🧹 [CLEANUP] Membersihkan data uji B2B...');
    if (testUserId) {
      await prisma.user_brand_claims.deleteMany({ where: { user_id: testUserId } }).catch(() => {});
      await prisma.user_ltp_transactions.deleteMany({ where: { user_id: testUserId } }).catch(() => {});
      await prisma.user_ltp_wallets.deleteMany({ where: { user_id: testUserId } }).catch(() => {});
      await prisma.user_xp.deleteMany({ where: { user_id: testUserId } }).catch(() => {});

      // Update voucher kembali menjadi unclaimed agar bisa dihapus via cascade brand_campaigns
      await prisma.brand_voucher_codes
        .updateMany({
          where: { claimed_by_user_id: testUserId },
          data: { claimed_by_user_id: null },
        })
        .catch(() => {});

      await prisma.users.delete({ where: { id: testUserId } }).catch(() => {});
    }
    if (testCampaignId) {
      await prisma.brand_voucher_codes.deleteMany({ where: { campaign_id: testCampaignId } }).catch(() => {});
      await prisma.brand_campaigns.delete({ where: { id: testCampaignId } }).catch(() => {});
    }
    if (testPartnerId) {
      await prisma.brand_partners.delete({ where: { id: testPartnerId } }).catch(() => {});
    }
    console.log('✔ [CLEANUP SELESAI] Basis data kembali bersih.\n');
    await prisma.$disconnect();
  }
}

runE2EB2BTest();

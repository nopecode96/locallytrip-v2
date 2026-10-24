import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedBrandPartners() {
  console.log('Seeding initial brand partners, campaigns, and voucher codes...');

  const brands = [
    // 0. FIRST-PARTY BRAND: Locallytrip Official
    {
      partner: {
        name: 'Locallytrip Official',
        slug: 'locallytrip-official',
        category: 'HOSPITALITY',
        logo_url: '/images/logo-icon.png',
        banner_url: '/images/rewards/hero-earning-traveler.png',
        website_url: 'https://locallytrip.com',
        contact_person: 'Locallytrip Team',
        contact_email: 'hello@locallytrip.com',
        contact_phone: '+6281200000000',
        description: 'First-party community perks dan merchandise resmi dari platform Locallytrip.',
        status: 'ACTIVE',
      },
      campaigns: [
        {
          title: 'T-Shirt Eksklusif "Founding Explorer"',
          slug: 'founding-explorer-tshirt',
          description: 'Kaos premium edisi terbatas untuk pengguna awal yang aktif.',
          terms: '1. Khusus anggota komunitas dengan reputasi Level 4 (Trailblazer) ke atas.\n2. Tim Locallytrip akan menghubungi via WhatsApp/Email untuk konfirmasi alamat pengiriman fisik.\n3. Bebas biaya pengiriman ke seluruh wilayah Indonesia.',
          image_url: '/images/rewards/tshirt-mockup.png',
          tier_package: 'PREMIUM_SPONSOR',
          placement_fee: 0,
          payment_status: 'WAIVED_BARTER',
          is_featured: true,
          cost_in_ltp: 1500,
          min_xp_level: 4, // Trailblazer
          total_quota: 100,
          claimed_quota: 15,
          end_date: new Date('2026-12-31T23:59:59Z'),
          vouchers: Array.from({ length: 100 }, (_, i) => `LT-TSHIRT-${1000 + i}`),
        },
        {
          title: 'Diskon Rp 50.000 Booking Tur Lokal',
          slug: 'diskon-tur-50k',
          description: 'Gunakan kode ini di checkout untuk potongan langsung Rp 50.000.',
          terms: '1. Masukkan kode voucher saat checkout pengalaman tur mana saja di Locallytrip.\n2. Potongan langsung Rp 50.000 tanpa batas minimum transaksi.\n3. Berlaku untuk 1 kali pemesanan per akun penjelajah.',
          image_url: '/images/rewards/discount-voucher.png',
          tier_package: 'PREMIUM_SPONSOR',
          placement_fee: 0,
          payment_status: 'WAIVED_BARTER',
          is_featured: true,
          cost_in_ltp: 500,
          min_xp_level: 1,
          total_quota: 500,
          claimed_quota: 42,
          end_date: new Date('2026-12-31T23:59:59Z'),
          vouchers: Array.from({ length: 500 }, (_, i) => `LT-DISC50K-${5000 + i}`),
        },
      ],
    },
    // 1. Bobocabin
    {
      partner: {
        name: 'Bobocabin by Bobobox',
        slug: 'bobocabin-indonesia',
        category: 'HOSPITALITY',
        logo_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&auto=format&fit=crop&q=80',
        banner_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80',
        website_url: 'https://bobobox.com/bobocabin',
        contact_person: 'Dimas Prasetyo',
        contact_email: 'partnership@bobobox.co.id',
        contact_phone: '+6281234567890',
        description: 'Jaringan cabin glamping berteknologi tinggi di tengah alam sejuk Indonesia (Cikole, Kintamani, Baturraden).',
        status: 'ACTIVE',
      },
      campaigns: [
        {
          title: 'Voucher Potongan Staycation Alam Rp 150.000',
          slug: 'voucher-bobocabin-150k',
          description: 'Nikmati pengalaman staycation modern di kabin estetik alam terbuka dengan diskon langsung Rp 150.000 untuk minimal menginap 1 malam di seluruh cabang Bobocabin se-Indonesia.',
          terms: '1. Berlaku untuk pemesanan via aplikasi resmi Bobobox.\n2. Tidak dapat digabungkan dengan promo flash sale lainnya.\n3. Berlaku untuk tipe kabin Deluxe dan Standard hingga 31 Desember 2026.',
          image_url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&auto=format&fit=crop&q=80',
          tier_package: 'FEATURED_PARTNER',
          placement_fee: 1500000,
          payment_status: 'PAID',
          is_featured: true,
          cost_in_ltp: 500,
          min_xp_level: 3,
          total_quota: 50,
          claimed_quota: 12,
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          vouchers: Array.from({ length: 50 }, (_, i) => `BOBO-LTP-${1000 + i}`),
        },
      ],
    },
    // 2. EIGER Adventure
    {
      partner: {
        name: 'EIGER Adventure',
        slug: 'eiger-adventure',
        category: 'OUTDOOR_GEAR',
        logo_url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=300&auto=format&fit=crop&q=80',
        banner_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
        website_url: 'https://eigeradventure.com',
        contact_person: 'Rian Hidayat',
        contact_email: 'marketing@eigeradventure.com',
        contact_phone: '+6281122334455',
        description: 'Brand perlengkapan outdoor, mountaineering, dan gaya hidup petualang tropis nomor satu di Indonesia sejak 1989.',
        status: 'ACTIVE',
      },
      campaigns: [
        {
          title: 'Diskon 30% Perlengkapan Gunung & Hiking Apparel',
          slug: 'diskon-eiger-30-percent',
          description: 'Dapatkan potongan 30% untuk seluruh koleksi ransel carrier, sepatu hiking, jas hujan waterproof, dan apparel petualangan EIGER.',
          terms: '1. Masukkan kode voucher saat checkout di situs eigeradventure.com.\n2. Maksimum diskon Rp 300.000 tanpa batas minimum pembelian.\n3. Berlaku untuk 1 kali transaksi per akun penjelajah.',
          image_url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=80',
          tier_package: 'FEATURED_PARTNER',
          placement_fee: 1500000,
          payment_status: 'PAID',
          is_featured: true,
          cost_in_ltp: 300,
          min_xp_level: 2,
          total_quota: 40,
          claimed_quota: 18,
          end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          vouchers: Array.from({ length: 40 }, (_, i) => `EIGER-EXPLORE-${2000 + i}`),
        },
      ],
    },
    // 3. Kopi Kenangan
    {
      partner: {
        name: 'Kopi Kenangan',
        slug: 'kopi-kenangan',
        category: 'FNB',
        logo_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
        banner_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop&q=80',
        website_url: 'https://kopikenangan.com',
        contact_person: 'Siti Sarah',
        contact_email: 'b2b@kopikenangan.com',
        contact_phone: '+6281987654321',
        description: 'Rantai kedai kopi grab-and-go terpopuler dengan racikan biji kopi Nusantara pilihan dan gula aren asli.',
        status: 'ACTIVE',
      },
      campaigns: [
        {
          title: 'Free Cup Kopi Susu Kenangan Mantan (Large Upgrade)',
          slug: 'free-cup-kopi-kenangan-mantan',
          description: 'Segarkan harimu setelah perjalanan panjang dengan gratis 1 cup reguler Kopi Kenangan Mantan atau gratis upgrade ke ukuran Large.',
          terms: '1. Tunjukkan kode voucher di kasir seluruh outlet Kopi Kenangan non-bandara.\n2. Berlaku setiap hari selama jam operasional outlet.',
          image_url: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=800&auto=format&fit=crop&q=80',
          tier_package: 'COMMUNITY_BARTER',
          placement_fee: 0,
          payment_status: 'WAIVED_BARTER',
          is_featured: false,
          cost_in_ltp: 100,
          min_xp_level: 1,
          total_quota: 100,
          claimed_quota: 45,
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          vouchers: Array.from({ length: 100 }, (_, i) => `KOPI-LTP-${5000 + i}`),
        },
      ],
    },
    // 4. Bluebird Group Travel
    {
      partner: {
        name: 'Bluebird Group Travel',
        slug: 'bluebird-travel',
        category: 'TRANSPORT',
        logo_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop&q=80',
        banner_url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&auto=format&fit=crop&q=80',
        website_url: 'https://bluebirdgroup.com',
        contact_person: 'Budi Hartono',
        contact_email: 'corporate@bluebirdgroup.com',
        contact_phone: '+628177889900',
        description: 'Layanan transportasi taksi dan armada sewa mobil terpercaya di puluhan destinasi wisata Indonesia.',
        status: 'ACTIVE',
      },
      campaigns: [
        {
          title: 'Potongan Rp 50.000 Antar Jemput Bandara & Wisata',
          slug: 'voucher-bluebird-50k',
          description: 'Voucher diskon perjalanan Rp 50.000 menggunakan layanan Goldenbird atau Bluebird via aplikasi MyBluebird.',
          terms: '1. Berlaku untuk pemesanan via aplikasi MyBluebird dengan metode pembayaran kartu kredit atau e-wallet.\n2. Tanpa minimum transaksi.',
          image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
          tier_package: 'COMMUNITY_BARTER',
          placement_fee: 0,
          payment_status: 'WAIVED_BARTER',
          is_featured: false,
          cost_in_ltp: 250,
          min_xp_level: 2,
          total_quota: 60,
          claimed_quota: 22,
          end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          vouchers: Array.from({ length: 60 }, (_, i) => `BB-TRIP-${3000 + i}`),
        },
      ],
    },
    // 5. Zurich Asuransi
    {
      partner: {
        name: 'Zurich Asuransi Perjalanan',
        slug: 'zurich-insurance',
        category: 'INSURANCE',
        logo_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300&auto=format&fit=crop&q=80',
        banner_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&auto=format&fit=crop&q=80',
        website_url: 'https://zurich.co.id',
        contact_person: 'Amanda Putri',
        contact_email: 'travel.affinity@zurich.co.id',
        contact_phone: '+6281334455667',
        description: 'Proteksi lengkap penjelajah untuk keterlambatan bagasi, pembatalan perjalanan, hingga tanggungan darurat medis alam bebas.',
        status: 'ACTIVE',
      },
      campaigns: [
        {
          title: 'Gratis Upgrade Polis Asuransi Perjalanan Domestik',
          slug: 'free-upgrade-zurich-travel-insurance',
          description: 'Klaim upgrade gratis perlindungan asuransi perjalanan ke tier Gold mencakup perlindungan gadget dan olahraga ekstrem petualangan.',
          terms: '1. Khusus pemegang akun Locallytrip aktif.\n2. Masukkan voucher saat aktivasi polis di portal Zurich Travel.',
          image_url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&auto=format&fit=crop&q=80',
          tier_package: 'COMMUNITY_BARTER',
          placement_fee: 0,
          payment_status: 'WAIVED_BARTER',
          is_featured: false,
          cost_in_ltp: 0,
          min_xp_level: 1,
          total_quota: 80,
          claimed_quota: 31,
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          vouchers: Array.from({ length: 80 }, (_, i) => `ZURICH-FREE-${4000 + i}`),
        },
      ],
    },
  ];

  for (const item of brands) {
    const partner = await prisma.brand_partners.upsert({
      where: { slug: item.partner.slug },
      update: {
        name: item.partner.name,
        category: item.partner.category,
        logo_url: item.partner.logo_url,
        banner_url: item.partner.banner_url,
        website_url: item.partner.website_url,
        contact_person: item.partner.contact_person,
        contact_email: item.partner.contact_email,
        contact_phone: item.partner.contact_phone,
        description: item.partner.description,
        status: item.partner.status,
      },
      create: item.partner,
    });

    console.log(`✓ Processed partner: ${partner.name} (${partner.slug})`);

    for (const camp of item.campaigns) {
      const existingCampaign = await prisma.brand_campaigns.findUnique({
        where: { slug: camp.slug },
      });

      let campaignId: number;

      if (!existingCampaign) {
        const createdCampaign = await prisma.brand_campaigns.create({
          data: {
            partner_id: partner.id,
            title: camp.title,
            slug: camp.slug,
            description: camp.description,
            terms: camp.terms,
            image_url: camp.image_url,
            tier_package: camp.tier_package,
            placement_fee: camp.placement_fee,
            payment_status: camp.payment_status,
            is_featured: camp.is_featured,
            cost_in_ltp: camp.cost_in_ltp,
            min_xp_level: camp.min_xp_level,
            total_quota: camp.total_quota,
            claimed_quota: camp.claimed_quota,
            end_date: camp.end_date,
            is_active: true,
          },
        });
        campaignId = createdCampaign.id;
        console.log(`  + Created campaign: ${createdCampaign.title}`);

        // Insert initial vouchers
        await prisma.brand_voucher_codes.createMany({
          data: camp.vouchers.map((code, idx) => ({
            campaign_id: campaignId,
            code,
            is_claimed: idx < camp.claimed_quota,
          })),
        });
        console.log(`    + Generated ${camp.vouchers.length} voucher codes.`);
      } else {
        campaignId = existingCampaign.id;
        await prisma.brand_campaigns.update({
          where: { id: campaignId },
          data: {
            title: camp.title,
            description: camp.description,
            terms: camp.terms,
            image_url: camp.image_url,
            tier_package: camp.tier_package,
            cost_in_ltp: camp.cost_in_ltp,
            min_xp_level: camp.min_xp_level,
            is_featured: camp.is_featured,
            is_active: true,
          },
        });
        console.log(`  * Updated campaign: ${existingCampaign.title}`);

        // Ensure vouchers exist if count is 0
        const voucherCount = await prisma.brand_voucher_codes.count({
          where: { campaign_id: campaignId },
        });
        if (voucherCount === 0) {
          await prisma.brand_voucher_codes.createMany({
            data: camp.vouchers.map((code, idx) => ({
              campaign_id: campaignId,
              code,
              is_claimed: idx < camp.claimed_quota,
            })),
          });
          console.log(`    + Generated ${camp.vouchers.length} voucher codes.`);
        }
      }
    }
  }

  console.log('🎉 Brand partners & campaign seeding completed successfully!');
}

if (require.main === module) {
  seedBrandPartners()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

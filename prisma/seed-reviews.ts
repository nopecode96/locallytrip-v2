import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Kumpulan template ulasan otentik dwibahasa berdasarkan tema pengalaman lokal
const reviewPool = [
  // Alam & Trekking Pegunungan
  {
    theme: 'nature',
    ratings: [5, 5, 4, 5, 5],
    items: [
      {
        title: 'Pengalaman Mendaki yang Sangat Berkesan',
        comment: 'Pemandu sangat profesional dan paham banget jalur alternatif yang tenang dan sepi turis. Waktu sunrise bener-bener dapet spot terbaik tanpa berdesakan. Sangat recommended buat yang cari petualangan otentik!',
      },
      {
        title: 'A Memorable & Safe Mountain Journey',
        comment: 'A memorable hike! The local host paced our climb very well and shared fascinating stories about the local legends of the mountain. Equipment and safety were top notch.',
      },
      {
        title: 'Pemandangan Juara & Guide Ramah',
        comment: 'Pengalaman seru dan menantang! Pemandu sabar banget nemenin teman kami yang baru pertama kali trekking. Makan siang dan teh hangat lokal yang disiapkan juga enak banget.',
      },
      {
        title: 'Petualangan Alam yang Rapi & Terencana',
        comment: 'Pemandangan luar biasa dan jalurnya seru. Sempat ada rintik hujan di awal perjalanan tapi pemandu sangat sigap mengantisipasi dengan jas hujan cadangan dan rute aman. Mantap!',
      },
      {
        title: 'Incredible sunrise views and great hospitality',
        comment: 'Breathtaking viewpoints that only a true local insider would know. The host was warm, attentive, and took incredible candid photos of our group throughout the trek.',
      },
      {
        title: 'Jalur trekking asri dan sangat edukatif',
        comment: 'Bukan sekadar mendaki, kami juga dijelaskan banyak hal tentang flora lokal dan cara menjaga kelestarian alam pegunungan. Luar biasa Locallytrip!',
      },
    ],
  },
  // Budaya, Seni & Heritage City Walk
  {
    theme: 'culture',
    ratings: [5, 5, 5, 4, 5],
    items: [
      {
        title: 'Tur Jalan Kaki yang Membuka Mata',
        comment: 'Tur jalan kaki yang membuka mata! Banyak sudut bersejarah dan cerita lokal tersembunyi yang nggak bakal kita temukan di Google atau travel guide biasa. Kopi lokalnya enak banget.',
      },
      {
        title: 'Enriching Cultural and Art Walk',
        comment: 'Such an enriching cultural experience! The host is clearly passionate about heritage architecture and local art. Time flew by so quickly. Will definitely book again!',
      },
      {
        title: 'Eksplorasi Sejarah yang Menyenangkan',
        comment: 'Pemandunya asik banget diajak ngobrol, humble, dan pengetahuannya tentang sejarah dan komunitas seni lokal luas sekali. Sangat worth it untuk siapa saja yang ingin mengenal kota lebih dalam.',
      },
      {
        title: 'Sisi Otentik Kota yang Memikat',
        comment: 'Pengalaman yang sangat berkesan untuk mengenal sisi otentik kota. Panduan yang ramah, spot foto retro yang apik, dan rekomendasi kuliner lokalnya jempolan.',
      },
      {
        title: 'Authentic local immersion at its finest',
        comment: 'Loved how intimate and relaxed the tour felt. We discovered quaint galleries, met local artisans, and tasted traditional snacks in hidden alleys away from the crowds.',
      },
      {
        title: 'Edukasi budaya yang dikemas santai',
        comment: 'Host sangat interaktif dan ramah anak. Penjelasan budayanya mudah dipahami dan suasana turnya sangat kekeluargaan.',
      },
    ],
  },
  // Kuliner & Food Tour
  {
    theme: 'foodie',
    ratings: [5, 5, 4, 5, 5],
    items: [
      {
        title: 'Surga Kuliner Tersembunyi!',
        comment: 'Diajak ke warung-warung legendaris yang antriannya lokal dan rasanya juara. Pemandu juga fleksibel menyesuaikan preferensi pedas kami. Perut kenyang dan hati senang!',
      },
      {
        title: 'Best Local Food Crawl Ever',
        comment: 'Best food crawl ever! Tasting authentic street delicacies with someone who actually grew up in the neighborhood made all the difference. Super delicious and hygienic.',
      },
      {
        title: 'Otentik dan Banyak Cerita Menarik',
        comment: 'Rekomendasi makanannya otentik banget, bukan sekadar tempat viral di sosmed. Pemandunya ramah dan seru banget nemenin kulineran malam keliling kota.',
      },
      {
        title: 'Wajib Coba untuk Pecinta Wisata Rasa',
        comment: 'Kulinernya mantap dan higienis. Pemandunya informatif menjelaskan asal-usul tiap hidangan dan bahan-bahan khas lokal. Sangat memuaskan!',
      },
      {
        title: 'Unforgettable culinary journey',
        comment: 'From the morning traditional market tastings to the hidden alley dessert stalls, every bite had a story. The host made sure our dietary needs were fully accommodated.',
      },
    ],
  },
  // Pantai, Pulau & Hidden Gems Pesisir
  {
    theme: 'beach',
    ratings: [5, 5, 5, 4, 5],
    items: [
      {
        title: 'Spot Pantai Alami yang Tenang',
        comment: 'Spot pantainya bener-bener hidden gem, airnya jernih banget dan sepi dari keramaian. Pemandu juga bantuin ambil foto dan video drone cinematic yang estetik buat feed sosmed. Juara!',
      },
      {
        title: 'An Absolute Coastal Paradise',
        comment: 'An absolute paradise. The secret viewpoints and crystal clear waters were breathtaking. The local host took great care of our group throughout the entire boat trip.',
      },
      {
        title: 'Pantai Eksotis & Panduan Ramah',
        comment: 'Pantai yang tenang dan sangat indah. Pemandu lokal sangat menguasai medan jalan dan waktu terbaik saat pasang surut air. Pengalaman tak terlupakan!',
      },
      {
        title: 'Piknik Pesisir yang Sempurna',
        comment: 'Lokasi tersembunyi yang sangat memanjakan mata. Perjalanan terbayar lunas dengan keindahan alam, kelapa muda segar, dan keramahan pemandu lokal.',
      },
      {
        title: 'Crystal clear water & wonderful secret coves',
        comment: 'We had the entire cove almost to ourselves. The host knew exactly when the tides were right for swimming and snorkeling. Highly recommended for couples or small groups!',
      },
    ],
  },
];

function pickTheme(title: string, description: string): typeof reviewPool[0] {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('mountain') || text.includes('gunung') || text.includes('hike') || text.includes('trekking') || text.includes('forest') || text.includes('waterfall') || text.includes('crater') || text.includes('merbabu') || text.includes('sangar') || text.includes('papandayan') || text.includes('wayang') || text.includes('kerenceng')) {
    return reviewPool[0]; // nature
  }
  if (text.includes('food') || text.includes('kuliner') || text.includes('culinary') || text.includes('eat') || text.includes('makan')) {
    return reviewPool[2]; // foodie
  }
  if (text.includes('beach') || text.includes('pantai') || text.includes('island') || text.includes('pulau') || text.includes('penida') || text.includes('bali') || text.includes('sea') || text.includes('ocean')) {
    return reviewPool[3]; // beach
  }
  return reviewPool[1]; // culture / default
}

function getRandomDateBetween(daysMinAgo: number, daysMaxAgo: number): Date {
  const now = Date.now();
  const minMs = daysMinAgo * 24 * 60 * 60 * 1000;
  const maxMs = daysMaxAgo * 24 * 60 * 60 * 1000;
  const randomMs = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Date(now - randomMs);
}

async function seedReviews() {
  console.log('🚀 Memulai proses seeding ulasan otentik & sinkronisasi rating...');

  // 1. Ambil daftar user aktif yang valid dari database (bukan peran internal admin)
  const users = await prisma.users.findMany({
    where: {
      is_active: true,
      role: { notIn: ['super admin', 'admin', 'finances', 'marketing', 'moderator'] },
    },
    select: {
      id: true,
      name: true,
      username: true,
    },
    orderBy: { id: 'asc' },
  });

  if (users.length === 0) {
    console.error('❌ Tidak ditemukan pengguna aktif untuk dijadikan ulasan.');
    return;
  }
  console.log(`✓ Ditemukan ${users.length} pengguna aktif siap dijadikan reviewer otentik.`);

  // 2. Ambil semua pengalaman tur berstatus 'published'
  const publishedExperiences = await prisma.experiences.findMany({
    where: {
      status: 'published',
    },
    include: {
      reviews: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log(`✓ Ditemukan ${publishedExperiences.length} pengalaman tur publik.`);

  let totalNewReviews = 0;
  let userIndex = 0;

  for (const exp of publishedExperiences) {
    const existingReviews = exp.reviews;

    // Jika pengalaman sudah memiliki ulasan (misal ID 6 yang memiliki 1 ulasan nyata),
    // kita sinkronkan rating_average dan rating_count tanpa menghapus review yang ada.
    if (existingReviews.length > 0) {
      const avg = Number((existingReviews.reduce((sum, r) => sum + Number(r.rating), 0) / existingReviews.length).toFixed(2));
      await prisma.experiences.update({
        where: { id: exp.id },
        data: {
          rating_average: avg,
          rating_count: existingReviews.length,
        },
      });
      console.log(`ℹ️ [ID: ${exp.id}] "${exp.title.slice(0, 40)}..." sudah punya ${existingReviews.length} ulasan -> Rating tersinkronisasi: ${avg}`);
      continue;
    }

    // Tentukan tema ulasan berdasarkan judul dan deskripsi pengalaman
    const themeData = pickTheme(exp.title, exp.description || '');

    // Buat 3 hingga 5 ulasan bervariasi per pengalaman tur
    const countToGenerate = Math.floor(Math.random() * 3) + 3; // 3, 4, atau 5 ulasan
    const availableItems = [...themeData.items].sort(() => Math.random() - 0.5);

    const createdReviews = [];

    for (let i = 0; i < countToGenerate && i < availableItems.length; i++) {
      // Cari user berikutnya yang bukan pemandu (host) dari pengalaman ini
      let reviewer = users[userIndex % users.length];
      let attempts = 0;
      while (reviewer.id === exp.host_id && attempts < users.length) {
        userIndex++;
        reviewer = users[userIndex % users.length];
        attempts++;
      }
      userIndex++;

      const reviewItem = availableItems[i];
      // Rating acak alami: 80% kemungkinan 5, 20% kemungkinan 4
      const rating = Math.random() < 0.8 ? 5 : 4;
      const createdAt = getRandomDateBetween(5, 120);

      const reviewRecord = await prisma.reviews.create({
        data: {
          experience_id: exp.id,
          user_id: reviewer.id,
          rating: rating,
          title: reviewItem.title,
          comment: reviewItem.comment,
          is_verified: true,
          created_at: createdAt,
          updated_at: createdAt,
        },
      });

      createdReviews.push(reviewRecord);
      totalNewReviews++;
    }

    // Hitung rata-rata dan total ulasan baru
    const sumRatings = createdReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Number((sumRatings / createdReviews.length).toFixed(2));

    await prisma.experiences.update({
      where: { id: exp.id },
      data: {
        rating_average: avgRating,
        rating_count: createdReviews.length,
      },
    });

    console.log(`✅ [ID: ${exp.id}] "${exp.title.slice(0, 40)}..." -> +${createdReviews.length} ulasan dibuat | Rata-rata: ${avgRating}`);
  }

  console.log(`\n🎉 SEEDING SELESAI: Berhasil menambahkan total ${totalNewReviews} ulasan otentik.`);
}

seedReviews()
  .catch((e) => {
    console.error('Error saat seeding reviews:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

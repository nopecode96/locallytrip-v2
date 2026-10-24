import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const updates: Record<number, {
  title_id: string;
  title_en: string;
  description_id: string;
  description_en: string;
  what_to_expect: string[];
  included_items: string[];
  excluded_items: string[];
  requirements: string[];
}> = {
  // 14: NuArt Sculpture Park
  14: {
    title_id: 'Jelajah NuArt Sculpture Park: Menikmati Mahakarya Seni Patung Kontemporer Nyoman Nuarta',
    title_en: 'NuArt Sculpture Park: Exploring the World of Modern Indonesian Sculpture',
    description_id: `NuArt Sculpture Park di Bandung adalah destinasi seni yang memadukan seni patung kontemporer, arsitektur megah, dan lanskap alam asri dalam satu kawasan yang menginspirasi. Didirikan sebagai ruang kreasi bagi karya-karya monumental maestro Nyoman Nuarta, taman seni ini memberi kesempatan bagi Anda untuk menikmati karya seni melampaui dinding galeri konvensional, di mana setiap patung berinteraksi secara harmonis dengan cahaya alami, ruang terbuka, dan rimbunnya pepohonan.

Saat menyusuri area taman terbuka, Anda akan menjumpai beragam patung berukuran masif yang sarat akan makna budaya, kekuatan bentuk, dan ekspresi modern. Tata letak taman dirancang dinamis, membawa pengunjung dalam petualangan visual yang mengejutkan di setiap sudut jalan setapak.

Di dalam galeri tertutup, perjalanan seni berlanjut dengan pameran kurasi yang menampilkan patung-patung berskala lebih intim, sketsa rancangan awal, serta rekaman proses kreatif di balik lahirnya karya-karya mahakarya besar seperti GWK Bali. Berkunjung ke NuArt bukan sekadar melihat patung, melainkan meresapi ruang seni hidup di mana imajinasi dan keahlian tangan berpadu secara abadi.`,
    description_en: `NuArt Sculpture Park in Bandung is a unique artistic destination where contemporary sculpture, architecture, and creative landscapes come together in one inspiring environment. Established as a dedicated space for monumental artworks, the park offers visitors the opportunity to explore art beyond traditional museum walls, allowing sculptures to interact naturally with light, space, and the surrounding environment.

As visitors walk through the open-air grounds, they encounter a variety of large-scale sculptures that reflect powerful forms, cultural narratives, and modern artistic expression. Each piece invites a different interpretation, encouraging viewers to experience art not only visually but also emotionally and spatially.

Inside the gallery spaces, the experience continues with curated exhibitions showcasing smaller sculptures, sketches, and creative processes behind the works, offering visitors a more intimate connection with the art.`,
    what_to_expect: [
      'Menyusuri taman patung terbuka (outdoor sculpture park) dan mengagumi patung-patung tembaga berskala monumental.',
      'Mengeksplorasi galeri indoor berlantai dua yang memamerkan karya seni eksklusif, sketsa, dan dokumentasi sejarah.',
      'Mengenal filosofi di balik karya agung Garuda Wisnu Kencana langsung di ruang studio sang maestro.',
      'Menikmati suasana santai, pepohonan rindang, dan sesi foto estetik di sudut-sudut kafe seni NuArt.'
    ],
    included_items: [
      'Sesi panduan dan kurasi karya seni oleh pemandu lokal',
      'Seluruh dokumentasi foto perjalanan selama kunjungan',
      'Akses ke seluruh area pameran galeri indoor dan outdoor'
    ],
    excluded_items: [
      'Transportasi menuju dan dari lokasi NuArt',
      'Tiket masuk resmi kawasan (dapat dibeli di loket)',
      'Konsumsi makanan dan minuman pribadi di restoran'
    ],
    requirements: [
      'Pakaian kasual dan sepatu jalan yang nyaman untuk berkeliling taman',
      'Kamera atau smartphone dengan baterai penuh',
      'Menjaga kebersihan dan tidak menyentuh karya seni tertentu sesuai aturan galeri'
    ]
  },

  // 15: Osaka Amazing Pass
  15: {
    title_id: 'Jelajah Efisien Osaka: Panduan Rute 1 Hari Memaksimalkan Osaka Amazing e-Pass',
    title_en: 'Maximize your Osaka Amazing e-Pass in 1 Day (Promo)',
    description_id: `Ingin memaksimalkan kartu Osaka Amazing e-Pass hanya dalam 1 hari tanpa tersesat dan tanpa repot menyusun jadwal dari nol? Panduan perjalanan terkurasi ini dirancang khusus untuk Anda!

Kami menyusun kembali rute perjalanan nyata yang paling efisien, lengkap dengan ketepatan waktu transit kereta bawah tanah, urutan destinasi ikonik dari pagi hingga malam, serta rekomendasi tempat kuliner halal-friendly dan ruang ibadah. Anda cukup mengikuti rute praktis ini tanpa perlu pusing memikirkan navigasi.

Rute ini mencakup spot terbaik Osaka mulai dari kemegahan Istana Osaka (Osaka Castle), pemandangan kota dari ketinggian Umeda Sky Building, pelayaran santai di Dotonbori, hingga suasana malam kota yang gemerlap. Hemat waktu, hemat biaya transportasi, dan nikmati Osaka semaksimal mungkin dalam 24 jam!`,
    description_en: `Unexpectedly needed a day rest so, I need to fully utilized Osaka Amazing e-pass in 1 Day remaining. How do I? Just go with the flow and here I'll recreate the exact route with some adjustment. A ready-to-use itinerary with timings, route, and food stops. No planning needed, just follow ours.`,
    what_to_expect: [
      'Menerima file panduan rencana perjalanan (itinerary) PDF interaktif dengan rute dan jadwal menit-demi-menit.',
      'Sesi konsultasi online via chat untuk menyesuaikan preferensi perjalanan Anda.',
      'Rekomendasi nama stasiun transit kereta subway dan jalur termudah di Osaka.',
      'Rekomendasi kuliner ramah muslim dan lokasi fasilitas ibadah di sekitar rute.'
    ],
    included_items: [
      'Sesi konsultasi perjalanan online',
      'Panduan rencana perjalanan PDF lengkap (rute optimal 1 hari Osaka Amazing Pass)',
      'Jadwal waktu-demi-waktu (timeline) yang realistis dan teruji',
      'Peta rute kereta bawah tanah (subway) dan nama stasiun transit',
      'Daftar rekomendasi kuliner halal-friendly dan lokasi musala/ruang salat',
      'Rincian estimasi anggaran (transportasi, kuliner, atraksi gratis pass)'
    ],
    excluded_items: [
      'Fisik kartu Osaka Amazing Pass (dibeli terpisah oleh pelancong)',
      'Tiket pesawat, akomodasi hotel, dan visa Jepang',
      'Biaya belanja dan pengeluaran pribadi selama di Jepang',
      'Pemandu fisik yang mendampingi di lokasi'
    ],
    requirements: [
      'Smartphone dengan aplikasi pembaca PDF dan Google Maps aktif',
      'Koneksi internet / eSIM / pocket WiFi selama berada di Osaka',
      'Kartu Osaka Amazing Pass aktif'
    ]
  },

  // 16: Taman Mini Indonesia Indah
  16: {
    title_id: 'Jelajah Keberagaman Nusantara: Tur Budaya Lengkap Taman Mini Indonesia Indah',
    title_en: 'Discover Indonesia in One Day: Taman Mini Cultural Tour',
    description_id: `Rasakan kekayaan dan keanekaragaman budaya nusantara di Taman Mini Indonesia Indah (TMII), sebuah destinasi legendaris yang merangkum seluruh pesona Indonesia dalam satu kawasan terpadu.

Perjalanan diawali di Museum Indonesia, tempat Anda dapat mengagumi busana adat, artefak bersejarah, dan kerajinan tangan dari Sabang sampai Merauke. Perjalanan dilanjutkan dengan menjelajahi anjungan-anjungan daerah ikonik seperti Sumatera Barat, Kalimantan Barat, Papua, Sulawesi Selatan, hingga Bali—masing-masing menampilkan arsitektur rumah adat yang megah dan pameran budaya yang autentik.

Di sela perjalanan, kita akan singgah di Pasar Nusantara untuk mencicipi aneka kuliner khas daerah yang menggugah selera. Anda juga akan diajak menaiki Kereta Gantung (Cable Car) untuk menyaksikan pemandangan miniatur kepulauan Indonesia dari ketinggian. Didukung fasilitas shuttle listrik ramah lingkungan, tur budaya ini menjamin kenyamanan Anda menjelajah nusantara dalam satu hari!`,
    description_en: `Experience the cultural richness of Indonesia at Taman Mini Indonesia Indah, a unique destination that brings the country’s vast diversity together in one place. Begin your journey at Museum Indonesia, where traditional art, craftsmanship, and historical displays offer insight into the nation’s heritage.

Continue exploring regional pavilions from West Sumatra, West Kalimantan, Papua, South Sulawesi, and Bali, each highlighting distinctive architecture and traditions. Take a break at Pasar Nusantara for authentic local dishes, and enjoy sweeping views of the archipelago on a scenic cable car ride.`,
    what_to_expect: [
      'Bertemu di titik temu TMII dan memulai eksplorasi warisan budaya di Museum Indonesia.',
      'Menyusuri anjungan rumah adat tradisional dari berbagai kepulauan nusantara.',
      'Menikmati keindahan lanskap miniatur kepulauan nusantara dari atas Kereta Gantung.',
      'Mencicipi kuliner lokal autentik di Pasar Nusantara dan berburu cenderamata khas.'
    ],
    included_items: [
      'Pemandu lokal berpengalaman dan berlisensi',
      'Tiket masuk utama kawasan TMII',
      'Tiket wahana Kereta Gantung (Cable Car)',
      'Akses shuttle bus listrik keliling kawasan TMII',
      'Dokumentasi foto perjalanan estetik'
    ],
    excluded_items: [
      'Transportasi dari dan menuju tempat tinggal ke TMII',
      'Makan siang dan jajan kuliner pribadi',
      'Sewa kendaraan pribadi listrik (skuter / buggy car opsi tambahan)',
      'Pengeluaran belanja suvenir pribadi'
    ],
    requirements: [
      'Pakaian kasual yang nyaman dan menyerap keringat',
      'Sepatu berjalan yang nyaman',
      'Topi atau payung pelindung panas matahari',
      'Kamera atau smartphone dengan baterai penuh'
    ]
  },

  // 17: Timeless Braga
  17: {
    title_id: 'Jelajah Braga Klasik: Susur Estetika Kopi, Seni Art Deco, dan Romantika Bandung Tempo Doeloe',
    title_en: 'Timeless Braga: Coffee, Art & Retro Vibes Walk ☕🎨✨',
    description_id: `Jalan Braga bukan sekadar jalanan biasa; Braga adalah denyut nadi romantika Kota Bandung. Begitu kaki Anda melangkah di atas bebatuan andesit ikonik Braga City Walk, Anda akan langsung merasakan atmosfer nostalgia tempo doeloe yang berpadu dengan geliat kreatif modern.

Dalam tur jalan kaki ini, kita akan menjelajahi sudut-sudut legendaris yang menyimpan kisah emas Bandung:
- Arsitektur & Sejarah: Mengagumi fasad bangunan bergaya Art Deco peninggalan era kolonial Belanda 1920-an sambil mendengarkan kisah-kisah menarik di baliknya.
- Wisata Kopi Nostalgia: Menikmati jeda santai di kedai kopi legendaris seperti Kopi Toko Djawa (bekas toko buku bersejarah) atau kafe artisanal lokal pilihan.
- Galeri Terbuka & Lukisan Jalanan: Menyapa pelukis lokal di trotoar Braga dan mengunjungi galeri seni tersembunyi yang sering terlewatkan wisatawan umum.
- Paduan Retro Modern: Mengunjungi butik-butik kreatif karya desainer lokal di sepanjang kawasan.

Bawalah pulang tidak hanya foto-foto estetik berkesan, tetapi juga serpihan jiwa dan kehangatan Kota Kembang.`,
    description_en: `Braga isn’t just a street; it’s a feeling. Our journey begins the moment your feet touch the iconic andesite stones of Braga City Walk. This isn't your typical shopping tour—it’s a deep dive into the hidden corners that give this area its legendary charm. Explore stunning Art Deco facades, taste artisanal local coffee, meet sidewalk painters, and absorb the golden-era romance of Bandung.`,
    what_to_expect: [
      'Berkumpul di titik temu Braga dan mengenal selayang pandang sejarah "Parijs van Java".',
      'Berjalan kaki santai mengamati detail arsitektur Art Deco dan spot foto klasik.',
      'Sesi ngopi santai dan berdiskusi di kedai kopi bernuansa retro.',
      'Berinteraksi dengan seniman lokal dan mengunjungi lorong seni tersembunyi.'
    ],
    included_items: [
      'Pemandu lokal bercerita (storyteller) berlisensi',
      'Satu cangkir kopi / minuman khas di kedai legendaris Braga',
      'Lembar panduan sejarah ringkas dan kosakata bahasa Sunda praktis',
      'Dokumentasi foto bernuansa vintage selama perjalanan'
    ],
    excluded_items: [
      'Transportasi menuju dan dari kawasan Jalan Braga',
      'Akomodasi hotel dan makan berat',
      'Pembelian lukisan seni atau belanja pakaian suvenir pribadi'
    ],
    requirements: [
      'Sepatu jalan kaki yang nyaman untuk trotoar andesit',
      'Pakaian kasual bertema retro/vintage (opsional untuk sesi foto menarik)',
      'Kamera atau smartphone dengan baterai penuh'
    ]
  },

  // 18: Omah Kecebong
  18: {
    title_id: 'Jelajah Omah Kecebong: Pengalaman Budaya Jawa Otentik, Gerobak Sapi & Kuliner Tradisional Jogja',
    title_en: 'Omah Kecebong : A Cultural "One Stop Destination" in Yogyakarta',
    description_id: `Omah Kecebong adalah destinasi sempurna bagi Anda yang mencintai kearifan lokal dan menginginkan pengalaman liburan yang berbeda dan berkesan di Yogyakarta. Di sini, Anda dapat mengenakan busana tradisional Jawa yang anggun seperti kebaya atau surjan lurik sambil menikmati suasana pedesaan yang asri.

Beragam aktivitas budaya autentik siap menyambut Anda, mulai dari berkeliling desa asri menaiki Gerobak Sapi tradisional, belajar melukis batik tulis, membuat wayang suket dari rerumputan, hingga bermain permainan tradisional anak tempo doeloe.

Tak ketinggalan, Anda akan disuguhi aneka hidangan kuliner tradisional khas Jawa yang dimasak dengan resep turun-temurun menggunakan tungku tanah liat. Liburan yang menenangkan, edukatif, dan penuh kenangan hangat bersama warga lokal!`,
    description_en: `Omah Kecebong is the perfect destination for those who love local culture and want to have a different experience while vacationing in Jogja. Wear traditional Javanese attire like kebaya or lurik, ride a traditional cow-drawn cart through countryside trails, learn the art of batik making, and savor authentic Javanese cuisine.`,
    what_to_expect: [
      'Penyambutan hangat dengan minuman herbal tradisional wedang uwuh dan jajanan pasar.',
      'Mengenakan pakaian adat Jawa (kebaya/surjan lurik) lengkap dengan blangkon.',
      'Merasakan sensasi unik menyusuri persawahan desa dengan Gerobak Sapi.',
      'Workshop membatik atau membuat kerajinan tradisional untuk dibawa pulang sebagai suvenir.',
      'Menikmati santap siang prasmanan masakan ndeso khas Jawa yang lezat.'
    ],
    included_items: [
      'Tiket masuk dan fasilitas penuh kawasan Omah Kecebong',
      'Sewa busana tradisional Jawa (kebaya / surjan lurik) untuk berfoto',
      'Tur keliling desa dengan Gerobak Sapi tradisional',
      'Materi dan alat workshop membatik (hasil batik menjadi suvenir)',
      'Makan siang prasmanan menu tradisional Jawa dan minuman selamat datang',
      'Pemandu lokal budaya Jawa berpengalaman'
    ],
    excluded_items: [
      'Transportasi dari kota Jogja menuju lokasi Omah Kecebong (bisa dibantu reservasi)',
      'Tiket pesawat / kereta api menuju Yogyakarta',
      'Pengeluaran belanja pribadi tambahan di galeri suvenir'
    ],
    requirements: [
      'Pakaian dalam yang nyaman untuk dilapisi pakaian adat',
      'Kamera atau smartphone untuk mengabadikan momen foto berbusana tradisional',
      'Antusiasme untuk belajar kebudayaan lokal'
    ]
  },

  // 19: Merak Kecil Island
  19: {
    title_id: 'Jelajah Pulau Merak Kecil: Surga Tersembunyi Berpasir Putih dan Air Biru di Selat Sunda',
    title_en: 'Merak Kecil Island: The "Hidden" Pocket-Sized Paradise',
    description_id: `Tak perlu terbang jauh ke Bali atau merogoh kocek dalam-dalam untuk merasakan ketenangan pulau berpasir putih dan laut biru toska. Tepat di balik hiruk-pikuk pelabuhan Merak, Cilegon, tersembunyi sebuah surga kecil bernama Pulau Merak Kecil.

Hanya dengan biaya setara secangkir kopi, Anda bisa menukar padatnya jalanan kota dengan hembusan angin laut Selat Sunda yang menyegarkan. Cukup menaiki perahu nelayan tradisional selama 5 menit dari Pantai Mabak, Anda sudah tiba di pulau mungil yang memesona ini.

Di satu sisi pulau, ombak tenang dan dangkal sangat cocok untuk berenang santai atau mengapung di atas pelampung. Di sisi seberang, gugusan karang eksotis menyambut deburan ombak, menjadi latar foto yang spektakuler. Anda juga bisa menyaksikan siluet kapal feri raksasa melintas di kejauhan. Pilihan tepat untuk refreshing akhir pekan hemat dan penuh keajaiban!`,
    description_en: `Skip the pricey flights to Bali. Hidden just behind the bustling port of Merak is a peaceful pocket-sized paradise with white sand and clear turquoise water called Merak Kecil Island. A short 5-minute traditional boat ride brings you to calm swimmable waters on one side and dramatic coral rock shores on the other.`,
    what_to_expect: [
      'Bertemu di titik kumpul Pantai Mabak dan menaiki perahu motor nelayan menyeberang ke pulau.',
      'Berenang dan bersantai di tepi pantai pasir putih berair jernih.',
      'Menjelajahi sisi karang pulau dengan pemandangan kapal-kapal besar di Selat Sunda.',
      'Berfoto estetik di spot hammock dan ayunan tepi pantai.'
    ],
    included_items: [
      'Pemandu lokal pendamping perjalanan',
      'Tiket perahu penyeberangan tradisional pulang-pergi (Pantai Mabak - Pulau Merak Kecil)',
      'Tiket retribusi kebersihan masuk kawasan pulau',
      'Dokumentasi foto perjalanan'
    ],
    excluded_items: [
      'Tiket transportasi kereta (KRL/KA Lokal) menuju Stasiun Merak',
      'Sewa peralatan snorkeling / pelampung di lokasi pulau',
      'Konsumsi makanan dan minuman pribadi'
    ],
    requirements: [
      'Pakaian renang / pakaian ganti yang nyaman',
      'Kacamata hitam, topi, dan tabir surya (sunscreen)',
      'Kantung plastik ramah lingkungan untuk membawa pulang sampah pribadi (Leave No Trace)'
    ]
  },

  // 20: Campervan Yogyakarta
  20: {
    title_id: 'Jelajah Alam Yogyakarta dengan Campervan: Road Trip Unik Menembus Hutan Pinus dan Tebing Eksotis',
    title_en: "Discover Yogyakarta's Natural Scenery with a Campervan",
    description_id: `Yogyakarta terkenal dengan wisata budaya dan sejarahnya seperti Keraton, Malioboro, dan Candi Prambanan. Namun di balik itu, Jogja menyimpan pesona alam pegunungan, perbukitan karst, dan pantai tersembunyi yang luar biasa indah.

Jika Anda menginginkan pengalaman liburan yang beda dari biasanya, rasakan sensasi road trip menjelajahi alam asri Yogyakarta menggunakan Campervan! Anda bisa bersantai di tepi perbukitan pinus sejuk, menikmati piknik privat di alam terbuka, menyeduh kopi hangat di tengah kabut pegunungan, hingga menunggu matahari terbit langsung dari jendela mobil Anda.

Didampingi pengemudi merangkap pemandu lokal berpengalaman, perjalanan ini memberi Anda kebebasan eksplorasi tanpa repot memikirkan rute jalanan terjal. Momen liburan tak terlupakan bersama keluarga atau sahabat!`,
    description_en: `Yogyakarta boasts breathtaking natural beauty beyond its famous historic temples. Experience a one-of-a-kind road trip in a fully equipped campervan exploring pine forests, highland viewpoints, and hidden coastal gems at your own relaxed pace.`,
    what_to_expect: [
      'Penjemputan di hotel/stasiun dengan unit campervan nyaman yang telah disiapkan.',
      'Menyusuri jalur pegunungan indah menuju spot alam terbaik di Yogyakarta.',
      'Menikmati sesi santai piknik outdoor dengan meja kursi lipat dan seduhan kopi lokal.',
      'Mengabadikan foto sinematik berlatar belakang alam dan campervan ikonik.'
    ],
    included_items: [
      'Sewa 1 unit Campervan lengkap dengan perlengkapan santai outdoor',
      'Pengemudi merangkap pemandu lokal berpengalaman',
      'Bahan bakar kendaraan (BBM) selama rute perjalanan',
      'Tiket masuk objek wisata alam dan biaya retribusi parkir',
      'Peralatan seduh kopi manual dan air mineral',
      'Dokumentasi foto momen perjalanan'
    ],
    excluded_items: [
      'Akomodasi penginapan sebelum dan sesudah jadwal tur campervan',
      'Makan siang dan malam di restoran lokal (sesuai pilihan peserta)',
      'Pengeluaran pribadi di luar fasilitas paket'
    ],
    requirements: [
      'Pakaian hangat atau jaket (suhu pegunungan bisa cukup dingin)',
      'Sepatu atau sandal outdoor yang nyaman',
      'Kamera atau smartphone dengan memori cukup untuk foto estetik'
    ]
  },

  // 21: Magical Forest De Djawatan
  21: {
    title_id: 'Jelajah Hutan Dongeng De Djawatan: Sesi Foto Memukau di Bawah Naungan Trembesi Raksasa Banyuwangi',
    title_en: 'Magical forest de jawatan',
    description_id: `Masuki dunia negeri dongeng nyata dan abadikan momen magis di Hutan De Djawatan, Banyuwangi! 🌿✨

Terkenal dengan pohon-pohon trembesi raksasa berusia ratusan tahun yang diselimuti tanaman paku pakis dan lumut hijau alami—mirip pemandangan Hutan Fangorn di film The Lord of the Rings—pengalaman foto ini dirancang santai, menyenangkan, dan dibimbing penuh.

Baik Anda datang bersama pasangan, keluarga, berpetualang solo, maupun bersama sahabat, pemandu lokal sekaligus fotografer berpengalaman akan mengarahkan pose secara natural tanpa kaku. Kita akan mencari sudut pandang (angle) terbaik, berburu berkas sinar matahari (ray of light) yang menembus celah rimbun dedaunan, dan menghasilkan foto-foto sinematik yang memukau untuk kenangan seumur hidup.`,
    description_en: `Step into a real-life fairytale and capture magical moments in the De Djawatan Forest, Banyuwangi! 🌿✨ Known for its giant, moss-draped trembesi trees reminiscent of fantasy movies, this guided photoshoot experience helps you capture stunning, cinematic memories with natural posing direction.`,
    what_to_expect: [
      'Bertemu di titik temu gerbang De Djawatan dan pengenalan rute spot foto terbaik.',
      'Menyusuri lorong pohon trembesi purba yang rimbun dan asri.',
      'Sesi pemotretan terarah dengan panduan pose natural berlatar cahaya alami.',
      'Menerima file foto hasil jepretan berkualitas tinggi yang sudah dikurasi.'
    ],
    included_items: [
      'Fotografer lokal profesional merangkap pemandu wisata',
      'Tiket masuk resmi kawasan Hutan De Djawatan Banyuwangi',
      'Pengarah gaya dan pose natural selama pemotretan',
      'Seluruh file foto resolusi tinggi (termasuk foto pilihan ber-editing warna estetik)',
      'Air mineral kemasan'
    ],
    excluded_items: [
      'Transportasi antar-jemput dari hotel menuju lokasi De Djawatan',
      'Sewa kostum atau pakaian khusus (disarankan memakai busana warna kontras/bumi)',
      'Pengeluaran belanja suvenir dan makanan pribadi'
    ],
    requirements: [
      'Pakaian berwarna earth-tone, putih, atau warna kontras yang estetik dengan warna hijau hutan',
      'Sepatu jalan atau sneakers yang nyaman',
      'Losion anti nyamuk bila diperlukan'
    ]
  },

  // 22: Bali Like a Local
  22: {
    title_id: 'Jelajah Bali Layaknya Warga Lokal: Rencana Perjalanan Privat Dikurasi Ahli Pariwisata Berbasis di Bali 🌴',
    title_en: 'Bali Like a Local: Custom Trip Planning by a Bali-Based Expert 🌴',
    description_id: `Bali adalah pulau dewata yang memukau, namun merencanakan liburan di Bali tidak semudah yang terlihat. Jarak antar-wilayah sering kali menipu, kondisi kemacetan lalu lintas dapat mengubah segalanya, banyak itinerary online yang tidak realistis, dan tempat yang paling viral di media sosial belum tentu yang terbaik untuk dikunjungi.

Berbekal pengalaman tinggal di Bali selama lebih dari 3 tahun dan merancang perjalanan kustom profesional di seluruh Indonesia, saya memiliki pengetahuan destinasi praktis serta jaringan tepercaya dengan pengemudi lokal, pemandu berlisensi, pengelola vila, hingga mitra aktivitas petualangan.

Saya akan menyusun rencana perjalanan Bali yang 100% dipersonalisasi khusus untuk Anda—disesuaikan dengan jumlah hari liburan, anggaran, gaya perjalanan, dan minat pribadi Anda. Baik Anda menginginkan petualangan pura sakral, air terjun tersembunyi, pantai privat, kuliner lokal legendaris, beach club, relaksasi wellness, maupun spot romantis, setiap rute disusun efisien dan logis.

Anda akan menghemat waktu berjam-jam riset, terhindar dari jebakan turis biasa, dan mendarat di Bali dengan kepastian penuh ke mana harus melangkah.`,
    description_en: `Bali is an incredible destination, but planning it properly is more complicated than it looks. Based on years of living in Bali and designing personalized trips across Indonesia, I will create a completely personalized Bali itinerary based on your days, budget, travel style, and interests—saving you hours of research and avoiding common tourist traps.`,
    what_to_expect: [
      'Sesi konsultasi mendalam via online chat / panggilan video untuk memetakan impian liburan Anda.',
      'Penyusunan rute perjalanan harian yang realistis, efisien waktu, dan bebas stres macet.',
      'Pemberian dokumen rencana perjalanan interaktif lengkap dengan tautan peta lokasi presisi.',
      'Dukungan tanya jawab lanjutan sebelum keberangkatan untuk memastikan perjalanan berjalan lancar.'
    ],
    included_items: [
      'Konsultasi online privat selama 60 menit',
      'Rencana perjalanan (itinerary) kustom harian yang detail dan realistis',
      'Dokumen PDF interaktif dan peta digital dengan pin lokasi tersimpan',
      'Rekomendasi area menginap, restoran lokal, dan aktivitas pilihan',
      'Estimasi rincian anggaran pengeluaran transparan',
      'Dua kali revisi itinerary',
      'Dukungan konsultasi lanjutan selama 7 hari sebelum perjalanan'
    ],
    excluded_items: [
      'Tiket penerbangan dan pemesanan akomodasi hotel',
      'Biaya sewa kendaraan, sopir, atau bensin di Bali',
      'Tiket masuk objek wisata dan biaya wahana petualangan',
      'Biaya makan, belanja, dan pengeluaran pribadi',
      'Pendampingan fisik secara langsung selama liburan'
    ],
    requirements: [
      'Aplikasi WhatsApp atau Google Meet untuk sesi konsultasi',
      'Informasi tanggal liburan, jumlah rombongan, dan preferensi aktivitas'
    ]
  },

  // 23: West Nusa Penida Adventure
  23: {
    title_id: 'Jelajah Nusa Penida Barat: Tebing Ikonik T-Rex Kelingking, Laguna Alami & Teluk Kristal Eksotis',
    title_en: 'West Nusa Penida Adventure: Cliffs, Lagoons & Turquoise Bays',
    description_id: `Awali petualangan tak terlupakan di Nusa Penida Barat dengan mengagumi Pantai Kelingking yang tersohor di dunia—sebuah formasi tebing karang dramatis menyerupai kepala dinosaurus T-Rex yang dibingkai oleh deburan ombak laut biru toska dan hamparan pasir putih bersih di bawahnya. Panorama spektakuler ini jauh lebih megah disaksikan langsung daripada sekadar di layar foto.

Dari Kelingking, perjalanan berlanjut menuju Angel's Billabong dan Broken Beach (Pasih Uug), dua keajaiban pesisir yang berdiri berdampingan. Angel's Billabong merupakan kolam laguna tanpa batas (infinity pool) alami yang terbentuk di sela batuan karang tebing dengan air sebening kristal. Tepat di sebelahnya, Broken Beach memukau mata dengan jembatan karang melingkar megah yang dilubangi ombak Samudra Hindia secara alami.

Sebagai penutup petualangan, nikmati suasana tenang di Crystal Bay—pantai berpasir putih landai dengan perairan damai yang jernih. Di sini Anda bisa berenang menyegarkan diri, bersantai di bawah rindang pohon kelapa, dan menikmati hangatnya matahari sore sebelum kembali berlayar ke Pulau Bali.`,
    description_en: `Start your West Nusa Penida adventure at Kelingking Beach, home to the island's most famous view, a cliff formation shaped like a dinosaur's head, framed by turquoise water and white sand far below. It's one of those views that photos never quite do justice.

From there, head to Angel's Billabong and Broken Beach, two dramatic coastal formations sitting side by side. Angel's Billabong is a natural infinity pool carved into the cliffside, while Broken Beach features a striking rock archway carved by the sea.

To close out the day, unwind at Crystal Bay — a calm, flat beach that lives up to its name. Here you're not just admiring nature from a distance; you can dip into the clear water yourself and experience it firsthand.`,
    what_to_expect: [
      'Menyeberang dari Pelabuhan Sanur ke Nusa Penida menggunakan kapal cepat (speedboat) nyaman.',
      'Menikmati keajaiban tebing T-Rex Kelingking Beach dan mengabadikan foto spektakuler dari gardu pandang.',
      'Menyaksikan keindahan laguna karang alami di Angel’s Billabong dan jembatan laut alami Broken Beach.',
      'Bersantap siang lezat dengan menu khas di restoran lokal Nusa Penida.',
      'Berenang atau bersantai di pasir putih Crystal Bay sebelum kembali berlayar ke Sanur Bali.'
    ],
    included_items: [
      'Tiket kapal cepat (speedboat) pulang-pergi (Sanur - Nusa Penida - Sanur)',
      'Transportasi mobil ber-AC selama tur di Nusa Penida',
      'Pengemudi merangkap pemandu lokal berpengalaman',
      'Makan siang lezat di restoran lokal setempat',
      'Air mineral kemasan selama perjalanan',
      'Biaya parkir kendaraan di seluruh objek wisata',
      'Tiket retribusi resmi kawasan wisata Nusa Penida'
    ],
    excluded_items: [
      'Transportasi antar-jemput dari hotel menuju Pelabuhan Sanur Bali (opsi tambahan)',
      'Aktivitas sewa alat snorkeling di Crystal Bay',
      'Pengeluaran belanja pribadi dan tips sukarela untuk kru/pengemudi'
    ],
    requirements: [
      'Pakaian kasual santai yang menyerap keringat dan pakaian ganti bila ingin berenang',
      'Sepatu jalan atau sandal gunung yang tidak licin',
      'Kacamata hitam, topi pantai, dan tabir surya (sunscreen)',
      'Kamera atau smartphone dengan baterai dan memori penuh',
      'Uang tunai secukupnya untuk keperluan pribadi di pulau'
    ]
  },

  // 24: Tumpak Sewu & Pronojiwo
  24: {
    title_id: 'Jelajah Tumpak Sewu & Pronojiwo: Petualangan Air Terjun Tirai Raksasa & Hidden Gems Lumajang',
    title_en: 'Tumpak Sewu & Pronojiwo Hidden Gems Adventure 💦🌿',
    description_id: `Siap menyaksikan salah satu lanskap alam paling spektakuler di Asia Tenggara? 🌿💦

Mari jelajahi kawasan Pronojiwo, Lumajang, rumah bagi Air Terjun Tumpak Sewu yang megah bagaikan tirai air raksasa berlatar gagahnya Gunung Semeru, serta berbagai surga tersembunyi yang masih alami.

Perjalanan kita dimulai dari gardu pandang panorama Tumpak Sewu, di mana Anda bisa menikmati pemandangan air terjun melingkar yang menakjubkan, berfoto, dan mendengarkan kisah kebudayaan lokal dari pemandu warga asli setempat. Jika kondisi fisik dan cuaca mendukung, kita dapat menuruni lembah menuju dasar air terjun dan Goa Tetes untuk merasakan percikan air suci nan menyegarkan.

Namun petualangan tidak berhenti di situ. Kita akan melanjutkan perjalanan menjelajahi keindahan tersembunyi Pronojiwo lainnya—seperti Air Terjun Kapas Biru atau spot pedesaan hijau yang menyejukkan. Sepanjang perjalanan, Anda akan merasakan keramahan warga lokal, udara sejuk pegunungan, serta kuliner khas pedesaan Jawa Timur.`,
    description_en: `Ready to see one of East Java's most breathtaking landscapes? 🌿💦

Let’s explore the beautiful Pronojiwo area of Lumajang, home to the spectacular Tumpak Sewu Waterfall and other incredible natural gems.

Our journey starts with the iconic Tumpak Sewu, a massive curtain-like waterfall surrounded by dramatic green cliffs. You’ll have time to enjoy the viewpoint, take photos, and learn about the local area and the stories behind this famous destination. We’ll continue exploring the surrounding Pronojiwo area, where lush landscapes, mountain views, local villages, and hidden waterfalls create a completely different side of Lumajang.`,
    what_to_expect: [
      'Kumpul di titik temu Tumpak Sewu dan penyambutan hangat oleh local host Pronojiwo.',
      'Menyaksikan keagungan panorama Air Terjun Tumpak Sewu dari gardu pandang tebing atas.',
      'Trekking menyusuri jalur alami menuju dasar lembah air terjun dan aliran Goa Tetes.',
      'Menjelajahi keindahan tersembunyi kawasan Pronojiwo seperti Air Terjun Kapas Biru.',
      'Mencicipi kuliner khas pedesaan Jawa Timur dan berinteraksi hangat dengan warga lokal.'
    ],
    included_items: [
      'Pemandu lokal (local guide) asli Pronojiwo berlisensi dan ramah',
      'Tiket masuk resmi kawasan wisata Air Terjun Tumpak Sewu & Goa Tetes',
      'Wawasan budaya lokal, legenda setempat, dan rekomendasi spot terbaik',
      'Bantuan dokumentasi foto dan video petualangan di spot-spot terbaik',
      'Pendampingan keselamatan selama trekking di jalur air terjun'
    ],
    excluded_items: [
      'Transportasi dari kota asal menuju titik temu di Pronojiwo Lumajang',
      'Biaya parkir kendaraan pribadi',
      'Makan siang, camilan, dan minuman pribadi',
      'Pengeluaran pribadi di luar fasilitas paket',
      'Asuransi perjalanan pribadi'
    ],
    requirements: [
      'Sepatu trekking atau sandal gunung anti-slip yang siap basah',
      'Pakaian olahraga/petualangan yang nyaman dan pakaian ganti lengkap',
      'Tas tahan air (dry bag) atau pelindung smartphone anti-air',
      'Kamera atau smartphone dengan baterai penuh',
      'Kebugaran fisik yang prima untuk menuruni jalur anak tangga'
    ]
  }
};

async function main() {
  console.log('--- Memperbarui Data Experiences 14 s.d. 24 dengan Bahasa Indonesia Terstandarisasi ---');

  for (const [idStr, data] of Object.entries(updates)) {
    const id = parseInt(idStr, 10);
    console.log(`Memperbarui ID #${id}...`);

    await prisma.experiences.update({
      where: { id },
      data: {
        title_id: data.title_id,
        title_en: data.title_en,
        description_id: data.description_id,
        description_en: data.description_en,
        what_to_expect: data.what_to_expect,
        included_items: data.included_items,
        excluded_items: data.excluded_items,
        requirements: data.requirements,
      },
    });

    console.log(`-> Sukses: ID #${id} (${data.title_id.slice(0, 45)}...)`);
  }

  console.log('\n--- Seluruh data 14-24 berhasil diperbarui ke Bahasa Indonesia yang sempurna! ---');
}

main()
  .catch((e) => {
    console.error('Error saat update database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

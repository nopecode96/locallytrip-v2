import { recordAiApiLog } from '@/lib/ai/quotaTracker';

export interface PersonaProfile {
  name: string;
  username: string;
  email: string;
  gender: 'male' | 'female';
  originCity: string;
  bio: string;
  travelStyle: 'Backpacker' | 'Culture & Foodie' | 'Photographer' | 'Outdoor & Trekking' | 'Solo Explorer';
  interests: string[];
}

const INDONESIAN_CITIES = [
  'Bandung', 'Jakarta', 'Yogyakarta', 'Surabaya', 'Semarang', 'Malang',
  'Bali Denpasar', 'Ubud, Bali', 'Medan', 'Padang', 'Makassar', 'Lombok',
  'Banda Neira', 'Labuan Bajo', 'Banyuwangi', 'Solo', 'Bogor'
];

const MALE_FIRST_NAMES = [
  'Budi', 'Rizky', 'Dimas', 'Aditya', 'Fajar', 'Bayu', 'Gilang', 'Rendra',
  'Bagas', 'Ilham', 'Arif', 'Dion', 'Satria', 'Arya', 'Genta', 'Farhan',
  'Aldi', 'Reza', 'Pratama', 'Hendra', 'Naufal', 'Irfan', 'Yoga'
];

const FEMALE_FIRST_NAMES = [
  'Nadia', 'Siti', 'Putri', 'Annisa', 'Dina', 'Tiara', 'Citra', 'Laras',
  'Ayu', 'Melati', 'Indah', 'Dewi', 'Fitri', 'Rania', 'Vina', 'Gisella',
  'Maya', 'Tari', 'Clara', 'Intan', 'Syifa', 'Zahra', 'Kania'
];

const LAST_NAMES = [
  'Pratama', 'Saputra', 'Kusuma', 'Santoso', 'Wijaya', 'Siregar', 'Lestari',
  'Hidayat', 'Wibowo', 'Nugroho', 'Firmansyah', 'Nasution', 'Kurniawan',
  'Permana', 'Utomo', 'Mahendra', 'Suryono', 'Gunawan', 'Hartono'
];

const TRAVEL_STYLES: PersonaProfile['travelStyle'][] = [
  'Backpacker', 'Culture & Foodie', 'Photographer', 'Outdoor & Trekking', 'Solo Explorer'
];

const INTERESTS_POOL = [
  'Hidden Gems', 'Kuliner Lokal', 'Kopi Nusantara', 'Sunrise Hunting', 'Street Photography',
  'Trekking Gunung', 'Snorkeling', 'Culture Heritage', 'Live Music', 'Solo Travel Tips'
];

/**
 * Menghasilkan data profil persona traveler Indonesia yang unik dan natural
 */
export function generateRandomPersona(): PersonaProfile {
  const isFemale = Math.random() > 0.5;
  const firstName = isFemale
    ? FEMALE_FIRST_NAMES[Math.floor(Math.random() * FEMALE_FIRST_NAMES.length)]
    : MALE_FIRST_NAMES[Math.floor(Math.random() * MALE_FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const fullName = `${firstName} ${lastName}`;

  const randomNum = Math.floor(100 + Math.random() * 899);
  const cleanUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}`.replace(/[^a-z0-9.]/g, '');
  const email = `${cleanUsername}@traveller.locallytrip.id`;

  const city = INDONESIAN_CITIES[Math.floor(Math.random() * INDONESIAN_CITIES.length)];
  const travelStyle = TRAVEL_STYLES[Math.floor(Math.random() * TRAVEL_STYLES.length)];

  // Shuffle 3 interests
  const shuffledInterests = [...INTERESTS_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);

  const bios = [
    `Penikmat senja & kopi lokal dari ${city}. Suka explore hidden spot bareng kawan baru.`,
    `Solo traveller & penggemar kuliner tradisional. Selalu siap diajak jalan & hunting foto di ${city}.`,
    `Trekking & nature enthusiast asal ${city}. Menyukai vibes otentik nusantara dan kearifan lokal.`,
    `Backpacker santai yang gemar blusukan ke desa wisata dan pasar tradisional. Basecamp: ${city}.`,
    `Travel blogger pemula asal ${city}. Berbagi cerita perjalanan nyata, tips hemat, dan rute seru.`
  ];
  const bio = bios[Math.floor(Math.random() * bios.length)];

  return {
    name: fullName,
    username: cleanUsername,
    email,
    gender: isFemale ? 'female' : 'male',
    originCity: city,
    bio,
    travelStyle,
    interests: shuffledInterests,
  };
}

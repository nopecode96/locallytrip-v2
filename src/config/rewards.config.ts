export const REWARD_RULES = {
  ACTIONS: {
    FORUM_CREATE_THREAD: { xp: 25, ltp: 5, label: 'Membuat Thread Forum' },
    FORUM_REPLY: { xp: 10, ltp: 2, label: 'Membalas Diskusi Forum' },
    FORUM_RECEIVE_UPVOTE: { xp: 5, ltp: 1, label: 'Mendapat Upvote Thread' },
    MEETUP_CREATE: { xp: 100, ltp: 25, label: 'Menginisiasi Agenda Meetup' },
    MEETUP_JOIN: { xp: 30, ltp: 5, label: 'Bergabung di Agenda Meetup' },
    EXPERIENCE_BOOKED: { xp: 100, ltp: 20, label: 'Menyelesaikan Pemesanan Tur' },
    EXPERIENCE_CREATE: { xp: 80, ltp: 10, label: 'Menerbitkan Pengalaman Tur Baru' },
    EXPERIENCE_REVIEW: { xp: 20, ltp: 5, label: 'Memberikan Ulasan Pengalaman' },
    TOUR_REVIEW: { xp: 20, ltp: 5, label: 'Memberikan Ulasan Tur' },
    STORY_PUBLISH: { xp: 50, ltp: 15, label: 'Menerbitkan Cerita Perjalanan' },
    KYC_VERIFIED: { xp: 150, ltp: 20, label: 'Verifikasi Identitas KYC' },
    WELCOME_AIRDROP: { xp: 500, ltp: 1000, label: 'Welcome Airdrop: Edisi Peluncuran' },
    REFERRAL_SIGNUP_INVITEE: { xp: 50, ltp: 0, label: 'Bonus Referral Pengguna Baru' },
    REFERRAL_SIGNUP_INVITER: { xp: 100, ltp: 10, label: 'Bonus Pengajak Referral' },
  },
  LEVEL_THRESHOLDS: [
    { level: 1, minXp: 0, title: 'New Explorer', badge: '🌱' },
    { level: 2, minXp: 100, title: 'Local Scout', badge: '🧭' },
    { level: 3, minXp: 300, title: 'Pathfinder', badge: '🥾' },
    { level: 4, minXp: 600, title: 'Trailblazer', badge: '⚡' },
    { level: 5, minXp: 1200, title: 'City Insider', badge: '🏙️' },
    { level: 6, minXp: 2500, title: 'Master Host', badge: '👑' },
  ],
  LTP_CONVERSION_RATE_IDR: 1000, // 1 LTP = Rp 1.000
} as const;

export type RewardActionKey = keyof typeof REWARD_RULES.ACTIONS;

import { PrismaClient } from '@prisma/client';
import { seedBrandPartners } from '../scripts/seed-brand-partners';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting platform bootstrapping seed...');

  // 1. Seed brand partners & first-party perks (Locallytrip Official)
  await seedBrandPartners();

  // 2. Ensure WELCOME_AIRDROP action rule exists
  await prisma.reward_action_rules.upsert({
    where: { action_code: 'WELCOME_AIRDROP' },
    update: {
      category: 'ONBOARDING',
      name_id: 'Welcome Airdrop: Edisi Peluncuran',
      name_en: 'Welcome Airdrop: Launch Edition',
      description_id: 'Bonus modal pendaftaran awal untuk 5.000 anggota pertama platform (1.000 LTP & 500 XP).',
      description_en: 'Initial signup welcome capital for the first 5,000 platform members (1,000 LTP & 500 XP).',
      xp_reward: 500,
      ltp_reward: 1000,
      max_frequency: 'ONCE',
      is_active: true,
    },
    create: {
      action_code: 'WELCOME_AIRDROP',
      category: 'ONBOARDING',
      name_id: 'Welcome Airdrop: Edisi Peluncuran',
      name_en: 'Welcome Airdrop: Launch Edition',
      description_id: 'Bonus modal pendaftaran awal untuk 5.000 anggota pertama platform (1.000 LTP & 500 XP).',
      description_en: 'Initial signup welcome capital for the first 5,000 platform members (1,000 LTP & 500 XP).',
      xp_reward: 500,
      ltp_reward: 1000,
      max_frequency: 'ONCE',
      is_active: true,
    },
  });

  console.log('✓ WELCOME_AIRDROP rule verified in reward_action_rules.');
  console.log('🎉 Platform bootstrapping seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error during platform seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

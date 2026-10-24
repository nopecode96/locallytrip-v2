import prisma from '@/lib/prisma';
import { REWARD_RULES, RewardActionKey } from '@/config/rewards.config';

export interface GrantRewardResult {
  addedXp: number;
  addedLtp: number;
  newLevel: number;
  newTotalXp: number;
  newBalance: number;
  rewardClaimCreated?: boolean;
}

/**
 * Universal Reward Engine
 * Atomically grants XP and LTP reward to user according to dynamic database rules.
 * - Queries `reward_action_rules` (fallback to memory config if unavailable)
 * - Evaluates level progression using `reward_level_tiers`
 * - Automatically registers `user_reward_claims` if user unlocks a level with physical/digital rewards
 */
export async function grantReward(
  userId: number,
  actionKey: RewardActionKey | string,
  referenceId?: string | number,
  referenceTable?: string
): Promise<GrantRewardResult | null> {
  if (!userId || !actionKey) return null;

  try {
    // 1. Ambil aturan aksi dari database (fallback ke REWARD_RULES.ACTIONS)
    let actionXp = 0;
    let actionLtp = 0;

    const dbRule = await prisma.reward_action_rules.findUnique({
      where: { action_code: actionKey },
    }).catch(() => null);

    if (dbRule && dbRule.is_active) {
      actionXp = dbRule.xp_reward;
      actionLtp = dbRule.ltp_reward;
    } else if (actionKey in REWARD_RULES.ACTIONS) {
      const fallbackRule = REWARD_RULES.ACTIONS[actionKey as RewardActionKey];
      actionXp = fallbackRule.xp;
      actionLtp = fallbackRule.ltp;
    } else {
      return null;
    }

    // 2. Ambil seluruh tier level dari database
    const dbTiers = await prisma.reward_level_tiers.findMany({
      where: { is_active: true },
      orderBy: { level: 'asc' },
    }).catch(() => []);

    return await prisma.$transaction(async (tx) => {
      let finalBalance = 0;

      // Mutasi reward LTP jika actionLtp > 0
      if (actionLtp > 0) {
        const wallet = await tx.user_ltp_wallets.upsert({
          where: { user_id: userId },
          create: {
            user_id: userId,
            balance: actionLtp,
            created_at: new Date(),
            updated_at: new Date(),
          },
          update: {
            balance: { increment: actionLtp },
            updated_at: new Date(),
          },
        });
        finalBalance = Number(wallet.balance);

        await tx.user_ltp_transactions.create({
          data: {
            user_id: userId,
            amount: actionLtp,
            type: 'credit',
            activity_type: actionKey.toLowerCase(),
            source_id: typeof referenceId === 'number' ? referenceId : null,
            source_table: referenceTable || 'system_rewards',
            created_at: new Date(),
          },
        });
      } else {
        const wallet = await tx.user_ltp_wallets.findUnique({
          where: { user_id: userId },
          select: { balance: true },
        });
        finalBalance = wallet ? Number(wallet.balance) : 0;
      }

      // Ambil XP saat ini
      const currentXpRecord = await tx.user_xp.findUnique({
        where: { user_id: userId },
      });

      const oldLevel = currentXpRecord?.current_level || 1;
      const newXpTotal = (currentXpRecord?.total_xp || 0) + actionXp;

      // Evaluasi level baru berdasarkan dbTiers (atau fallback ke config)
      let newLevel = 1;
      let matchedTier: any = null;

      if (dbTiers && dbTiers.length > 0) {
        for (const t of dbTiers) {
          if (newXpTotal >= t.min_xp) {
            newLevel = t.level;
            matchedTier = t;
          }
        }
      } else {
        for (const t of REWARD_RULES.LEVEL_THRESHOLDS) {
          if (newXpTotal >= t.minXp) {
            newLevel = t.level;
          }
        }
      }

      await tx.user_xp.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          total_xp: newXpTotal,
          current_level: newLevel,
          created_at: new Date(),
          updated_at: new Date(),
        },
        update: {
          total_xp: newXpTotal,
          current_level: newLevel,
          updated_at: new Date(),
        },
      });

      // Catat riwayat XP
      await tx.user_xp_history.create({
        data: {
          user_id: userId,
          amount: actionXp,
          activity_type: actionKey.toLowerCase(),
          source_id: typeof referenceId === 'number' ? referenceId : null,
          source_table: referenceTable || 'system_rewards',
          created_at: new Date(),
        },
      });

      // Jika user naik level dan level baru memiliki hadiah fisik/voucher (reward_type !== 'NONE')
      let rewardClaimCreated = false;
      if (newLevel > oldLevel && matchedTier && matchedTier.reward_type !== 'NONE') {
        const existingClaim = await tx.user_reward_claims.findFirst({
          where: {
            user_id: userId,
            level: newLevel,
          },
        });

        if (!existingClaim) {
          await tx.user_reward_claims.create({
            data: {
              user_id: userId,
              level: newLevel,
              reward_type: matchedTier.reward_type,
              reward_title: matchedTier.reward_title_id || matchedTier.reward_title_en || `Level ${newLevel} Reward`,
              status: 'PENDING',
              claimed_at: new Date(),
            },
          });
          rewardClaimCreated = true;
        }
      }

      // Notifikasi lonceng otomatis untuk reward XP / Level Up / Koin LTP
      if (newLevel > oldLevel) {
        await tx.notifications.create({
          data: {
            user_id: userId,
            title: `Naik Level: Level ${newLevel}! ⚡`,
            message: `Selamat! Anda berhasil mencapai Level ${newLevel}. Kunjungi halaman reward untuk melihat keuntungan baru Anda.`,
            type: 'REWARD_XP',
            action_url: `/community/rewards`,
            created_at: new Date(),
            updated_at: new Date(),
          },
        }).catch(() => {});
      } else if (actionLtp > 0) {
        await tx.notifications.create({
          data: {
            user_id: userId,
            title: actionKey === 'WELCOME_AIRDROP' ? 'Welcome Reward Diterima! 🎁' : `Reward Kredit: +${actionLtp} LTP 🪙`,
            message: actionKey === 'WELCOME_AIRDROP'
              ? 'Selamat datang! Saldo modal 1.000 Kredit LTP & 500 XP telah masuk ke dompet Anda.'
              : `Anda memperoleh bonus +${actionLtp} Kredit LTP dari aktivitas komunitas.`,
            type: 'REWARD_LTP',
            action_url: '/community/perks',
            created_at: new Date(),
            updated_at: new Date(),
          },
        }).catch(() => {});
      }

      return {
        addedXp: actionXp,
        addedLtp: actionLtp,
        newLevel,
        newTotalXp: newXpTotal,
        newBalance: finalBalance,
        rewardClaimCreated,
      };
    });
  } catch (error) {
    console.error(`Failed to grant reward ${actionKey} for user ${userId}:`, error);
    return null;
  }
}


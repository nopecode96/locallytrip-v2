import React from 'react';
import type { Metadata } from 'next';
import { getAdminEconomyData } from '@/actions/admin/economy';
import { EconomyControlClient } from '@/components/admin/economy/EconomyControlClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gamification Scoring & LTP/XP Economy | Locallytrip CMS',
  description: 'Control center for circulating LTP tokens, XP leaderboards, and redemption claims.',
};

export default async function AdminEconomyPage() {
  const {
    stats,
    leaderboard,
    claims,
    transactions,
    success,
    error,
  } = await getAdminEconomyData();

  if (!success) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-950/30 border border-rose-900 rounded-3xl">
        Terjadi kendala memuat data telemetri ekonomi LTP/XP: {error}
      </div>
    );
  }

  return (
    <EconomyControlClient
      stats={stats}
      initialLeaderboard={leaderboard}
      initialClaims={claims}
      initialTransactions={transactions}
    />
  );
}

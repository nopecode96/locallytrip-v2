import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { REWARD_RULES } from '@/config/rewards.config';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('locallytrip_session')?.value;

  if (sessionToken) {
    const session = await prisma.user_sessions.findUnique({
      where: { session_token: sessionToken },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
            role: true,
            is_verified: true,
          },
        },
      },
    });

    if (session?.users) {
      return session.users;
    }
  }

  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const threadId = parseInt(id, 10);

    if (isNaN(threadId)) {
      return NextResponse.json({ success: false, error: 'Invalid thread ID' }, { status: 400 });
    }

    // 1. Auth Guard untuk pengirim tip
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Silakan masuk untuk mengirim tip' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount = 5, note = '' } = body;
    const tipNumber = Number(amount);

    if (isNaN(tipNumber) || tipNumber <= 0) {
      return NextResponse.json({ success: false, error: 'Jumlah koin LTP tidak valid' }, { status: 400 });
    }

    const thread = await prisma.vibes_forum_threads.findUnique({
      where: { id: threadId },
      include: {
        users_vibes_forum_threads_author_idTousers: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ success: false, error: 'Thread tidak ditemukan' }, { status: 404 });
    }

    const recipientId = thread.author_id;
    if (recipientId === authUser.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak dapat mengirim tip ke thread Anda sendiri' },
        { status: 400 }
      );
    }

    // Eksekusi transfer saldo atomik menggunakan prisma.$transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek saldo wallet pengirim
      let senderWallet = await tx.user_ltp_wallets.findUnique({
        where: { user_id: authUser.id },
      });

      if (!senderWallet) {
        // Jika belum ada, buat dengan saldo awal 50 LTP agar pengguna bisa berinteraksi
        senderWallet = await tx.user_ltp_wallets.create({
          data: {
            user_id: authUser.id,
            balance: 50,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      if (Number(senderWallet.balance) < tipNumber) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // 2. Kurangi saldo LTP pengirim
      const updatedSenderWallet = await tx.user_ltp_wallets.update({
        where: { user_id: authUser.id },
        data: {
          balance: { decrement: tipNumber },
          updated_at: new Date(),
        },
      });

      // Catat mutasi debit pengirim
      await tx.user_ltp_transactions.create({
        data: {
          user_id: authUser.id,
          amount: -tipNumber,
          type: 'debit',
          activity_type: 'forum_tip_sent',
          source_id: threadId,
          source_table: 'vibes_forum_threads',
          created_at: new Date(),
        },
      });

      // 3. Tambahkan saldo LTP penerima (penulis thread)
      const updatedRecipientWallet = await tx.user_ltp_wallets.upsert({
        where: { user_id: recipientId },
        create: {
          user_id: recipientId,
          balance: tipNumber,
          created_at: new Date(),
          updated_at: new Date(),
        },
        update: {
          balance: { increment: tipNumber },
          updated_at: new Date(),
        },
      });

      // Catat mutasi credit penerima
      await tx.user_ltp_transactions.create({
        data: {
          user_id: recipientId,
          amount: tipNumber,
          type: 'credit',
          activity_type: 'forum_tip_received',
          source_id: threadId,
          source_table: 'vibes_forum_threads',
          created_at: new Date(),
        },
      });

      // 4. Beri bonus XP ke pengirim atas kedermawanan komunitas (misal: tipNumber * 2)
      const senderXpRecord = await tx.user_xp.findUnique({
        where: { user_id: authUser.id },
      });
      const senderBonusXp = Math.max(5, tipNumber * 2);
      const newSenderXp = (senderXpRecord?.total_xp || 0) + senderBonusXp;

      let newSenderLevel = 1;
      for (const t of REWARD_RULES.LEVEL_THRESHOLDS) {
        if (newSenderXp >= t.minXp) newSenderLevel = t.level;
      }

      await tx.user_xp.upsert({
        where: { user_id: authUser.id },
        create: {
          user_id: authUser.id,
          total_xp: newSenderXp,
          current_level: newSenderLevel,
          created_at: new Date(),
          updated_at: new Date(),
        },
        update: {
          total_xp: newSenderXp,
          current_level: newSenderLevel,
          updated_at: new Date(),
        },
      });

      // 5. Beri bonus XP ke penerima thread (misal: tipNumber * 3)
      const recipientXpRecord = await tx.user_xp.findUnique({
        where: { user_id: recipientId },
      });
      const recipientBonusXp = tipNumber * 3;
      const newRecipientXp = (recipientXpRecord?.total_xp || 0) + recipientBonusXp;

      let newRecipientLevel = 1;
      for (const t of REWARD_RULES.LEVEL_THRESHOLDS) {
        if (newRecipientXp >= t.minXp) newRecipientLevel = t.level;
      }

      await tx.user_xp.upsert({
        where: { user_id: recipientId },
        create: {
          user_id: recipientId,
          total_xp: newRecipientXp,
          current_level: newRecipientLevel,
          created_at: new Date(),
          updated_at: new Date(),
        },
        update: {
          total_xp: newRecipientXp,
          current_level: newRecipientLevel,
          updated_at: new Date(),
        },
      });

      return {
        tippedAmount: tipNumber,
        newSenderBalance: Number(updatedSenderWallet.balance),
        senderBonusXp,
        newSenderLevel,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengirim ${tipNumber} LTP Coin! Anda mendapatkan +${result.senderBonusXp} XP.`,
      tippedAmount: tipNumber,
      remainingBalance: result.newSenderBalance,
      bonusXp: result.senderBonusXp,
      authorName: thread.users_vibes_forum_threads_author_idTousers?.name,
    });
  } catch (error: any) {
    if (error?.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json(
        { success: false, error: 'Saldo koin LTP Anda tidak mencukupi untuk memberikan tip ini.' },
        { status: 400 }
      );
    }
    console.error('Error sending LTP tip:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

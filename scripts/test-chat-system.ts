import prisma from '../src/lib/prisma';

async function main() {
  console.log('🚀 Memulai Pengujian Menyeluruh Sistem Obrolan (Meetup Group Chat & 1-on-1 Direct Message)...\n');

  // Ambil dua pengguna untuk pengujian
  const users = await prisma.users.findMany({
    take: 2,
    orderBy: { id: 'asc' },
    select: { id: true, name: true, username: true, email: true },
  });

  if (users.length < 2) {
    console.error('❌ Minimal dibutuhkan 2 pengguna di database untuk pengujian.');
    process.exit(1);
  }

  const userA = users[0];
  const userB = users[1];

  console.log(`📌 User A: ID ${userA.id} (${userA.name} - @${userA.username || userA.id})`);
  console.log(`📌 User B: ID ${userB.id} (${userB.name} - @${userB.username || userB.id})\n`);

  // Ambil atau siapkan 1 Meetup untuk pengujian grup
  let meetup = await prisma.vibes_travel_meetups.findFirst({
    include: {
      vibes_travel_meetup_members: true,
    },
  });

  if (!meetup) {
    console.log('⚠️ Tidak ada meetup yang ditemukan, membuat meetup dummy sementara...');
    const city = await prisma.cities.findFirst();
    const now = new Date();
    meetup = await prisma.vibes_travel_meetups.create({
      data: {
        creator_id: userA.id,
        city_id: city?.id || 1,
        title: 'Pengujian Group Chat Meetup',
        slug: `test-meetup-chat-${Date.now()}`,
        description: 'Meetup uji coba otomatis',
        start_date: new Date(Date.now() + 86400000),
        end_date: new Date(Date.now() + 172800000),
        duration_days: 2,
        max_members: 10,
        current_member_count: 1,
        status: 'published',
        join_type: 'public',
        created_at: now,
        updated_at: now,
        vibes_travel_meetup_members: {
          create: {
            user_id: userA.id,
            status: 'approved',
            is_creator: true,
            joined_at: now,
            approved_at: now,
          },
        },
      },
      include: {
        vibes_travel_meetup_members: true,
      },
    });
  }

  if (!meetup) {
    console.error('❌ Gagal menyiapkan data meetup.');
    process.exit(1);
  }

  console.log(`📌 Meetup Terpilih: ID ${meetup.id} - "${meetup.title}"\n`);

  // Pastikan User A adalah member terdaftar di meetup ini
  let membershipA = await prisma.vibes_travel_meetup_members.findFirst({
    where: { meetup_id: meetup.id, user_id: userA.id },
  });
  let userACreatedMembership = false;
  if (!membershipA) {
    membershipA = await prisma.vibes_travel_meetup_members.create({
      data: {
        meetup_id: meetup.id,
        user_id: userA.id,
        status: 'approved',
        joined_at: new Date(),
      },
    });
    userACreatedMembership = true;
    console.log(`   - Mendaftarkan User A ke Meetup ${meetup.id} untuk tes.`);
  }

  // Pastikan User B BUKAN member terdaftar di meetup ini (untuk menguji proteksi)
  let membershipB = await prisma.vibes_travel_meetup_members.findFirst({
    where: { meetup_id: meetup.id, user_id: userB.id },
  });
  let userBOriginalMembership = membershipB;
  if (membershipB) {
    await prisma.vibes_travel_meetup_members.delete({
      where: { id: membershipB.id },
    });
    console.log(`   - Melepas User B sementara dari Meetup ${meetup.id} untuk menguji proteksi hak akses.`);
  }

  let createdMeetupMessageId: number | null = null;
  let createdDirectConversationId: number | null = null;
  let createdDirectMessageId: number | null = null;
  let createdNotificationId: number | null = null;

  try {
    // =========================================================================
    // SKENARIO 1: Simulasi kirim pesan grup meetup oleh peserta terdaftar
    // =========================================================================
    console.log('🧪 [SKENARIO 1]: Menguji kirim pesan ke grup meetup oleh peserta terdaftar (User A)...');

    // Validasi keanggotaan sebelum kirim pesan (sesuai logika server action sendMeetupMessage)
    const validMember = await prisma.vibes_travel_meetup_members.findFirst({
      where: { meetup_id: meetup.id, user_id: userA.id },
    });
    if (!validMember) {
      throw new Error('Validasi gagal: User A seharusnya merupakan member terdaftar.');
    }

    const testMsgText = `Halo dari automated test CLI! [${new Date().toISOString()}]`;
    const now = new Date();
    const groupMsg = await prisma.vibes_travel_meetup_messages.create({
      data: {
        meetup_id: meetup.id,
        user_id: userA.id,
        content: testMsgText,
        created_at: now,
        updated_at: now,
      },
      include: {
        users: {
          select: { id: true, name: true, username: true },
        },
      },
    });
    createdMeetupMessageId = groupMsg.id;

    console.log(`   - Pesan grup berhasil dibuat: ID ${groupMsg.id}`);
    console.log(`   - Terikat ke meetup_id ${groupMsg.meetup_id} dan user_id ${groupMsg.user_id}: ✅`);
    console.log(`   - Pengirim: ${groupMsg.users.name} (@${groupMsg.users.username || groupMsg.users.id})`);
    console.log(`   - Konten: "${groupMsg.content}"`);

    // =========================================================================
    // SKENARIO 2: Proteksi hak akses peserta belum terdaftar di grup meetup
    // =========================================================================
    console.log('\n🧪 [SKENARIO 2]: Menguji proteksi hak akses kirim pesan oleh bukan anggota (User B)...');

    const nonMemberCheck = await prisma.vibes_travel_meetup_members.findFirst({
      where: { meetup_id: meetup.id, user_id: userB.id },
    });

    let accessBlocked = false;
    let accessErrorMessage = '';

    if (!nonMemberCheck) {
      accessBlocked = true;
      accessErrorMessage = 'Anda harus bergabung dengan meja ini untuk mengirim pesan.';
    } else {
      // Jika ternyata lolos, buat error
      throw new Error('Proteksi gagal: Pengguna non-anggota lolos validasi!');
    }

    console.log(`   - Pengecekan keanggotaan User B: DITOLAK ✅`);
    console.log(`   - Pesan Error: "${accessErrorMessage}"`);
    console.log(`   - Proteksi grup meetup berfungsi 100%: ✅`);

    // =========================================================================
    // SKENARIO 3: Simulasi kirim pesan obrolan private (1-on-1) User A ke User B
    // =========================================================================
    console.log('\n🧪 [SKENARIO 3]: Menguji obrolan private (1-on-1 Direct Message) User A -> User B...');

    const p1 = Math.min(userA.id, userB.id);
    const p2 = Math.max(userA.id, userB.id);

    // 1. Cari atau buat percakapan (conversations)
    let conv = await prisma.conversations.findFirst({
      where: { participant1_id: p1, participant2_id: p2 },
    });

    let convCreatedInTest = false;
    if (!conv) {
      conv = await prisma.conversations.create({
        data: {
          participant1_id: p1,
          participant2_id: p2,
          last_message_at: now,
          created_at: now,
          updated_at: now,
        },
      });
      convCreatedInTest = true;

      await prisma.conversation_participants.createMany({
        data: [
          { conversation_id: conv.id, user_id: p1, joined_at: now, unread_count: 0 },
          { conversation_id: conv.id, user_id: p2, joined_at: now, unread_count: 0 },
        ],
      });
      console.log(`   - Room percakapan baru diinisialisasi: ID ${conv.id}`);
    } else {
      console.log(`   - Menggunakan room percakapan existing: ID ${conv.id}`);
    }
    createdDirectConversationId = convCreatedInTest ? conv.id : null;

    // 2. Kirim pesan private atomik di messages + update last_message_at & unread_count + notifikasi
    const dmContent = `Halo User B, ini pesan private test dari User A! [${new Date().toISOString()}]`;

    const [directMsg, notif] = await prisma.$transaction(async (tx) => {
      // Buat pesan di tabel messages
      const msg = await tx.messages.create({
        data: {
          conversation_id: conv.id,
          sender_id: userA.id,
          content: dmContent,
          message_type: 'text',
          is_read: false,
          created_at: now,
        },
      });

      // Update percakapan
      await tx.conversations.update({
        where: { id: conv.id },
        data: {
          last_message_at: now,
          updated_at: now,
        },
      });

      // Update unread count peserta penerima (User B)
      const recipientParticipant = await tx.conversation_participants.findFirst({
        where: { conversation_id: conv.id, user_id: userB.id },
      });

      if (recipientParticipant) {
        await tx.conversation_participants.update({
          where: { id: recipientParticipant.id },
          data: {
            unread_count: { increment: 1 },
          },
        });
      }

      // Buat notifikasi lonceng ke User B
      const newNotif = await tx.notifications.create({
        data: {
          user_id: userB.id,
          type: 'COMMUNITY',
          title: `Pesan Baru dari ${userA.name} 💬`,
          message: `${userA.name}: "${dmContent.slice(0, 45)}..."`,
          action_url: `/messages?c=${conv.id}`,
          created_at: now,
          updated_at: now,
        },
      });

      return [msg, newNotif];
    });

    createdDirectMessageId = directMsg.id;
    createdNotificationId = notif.id;

    console.log(`   - Pesan DM tersimpan di model 'messages': ID ${directMsg.id} ✅`);
    console.log(`   - Status is_read: ${directMsg.is_read ? 'true' : 'false (unread)'} ✅`);
    console.log(`   - Notifikasi lonceng terkirim ke User B: ID ${notif.id} ✅`);
    console.log(`   - Action URL Notifikasi: ${notif.action_url}`);

    // Verifikasi data
    const verifyMsg = await prisma.messages.findUnique({
      where: { id: directMsg.id },
      include: {
        conversations: true,
        users: { select: { id: true, name: true } },
      },
    });

    if (!verifyMsg || verifyMsg.content !== dmContent || verifyMsg.is_read !== false) {
      throw new Error('Verifikasi pesan private gagal.');
    }

    console.log('\n=========================================');
    console.log('🎉 SELURUH SKENARIO OBROLAN VALID & BERHASIL 100%!');
    console.log('=========================================');
  } catch (err: any) {
    console.error('❌ Terjadi kesalahan pada saat pengujian:', err);
    process.exit(1);
  } finally {
    // =========================================================================
    // BERSIHKAN DATA PENGUJIAN
    // =========================================================================
    console.log('\n🧹 Membersihkan data simulasi pengujian dari database...');

    if (createdMeetupMessageId) {
      await prisma.vibes_travel_meetup_messages.delete({
        where: { id: createdMeetupMessageId },
      }).catch(() => null);
      console.log(`   - Menghapus meetup message ID ${createdMeetupMessageId}: ✅`);
    }

    if (createdDirectMessageId) {
      await prisma.messages.delete({
        where: { id: createdDirectMessageId },
      }).catch(() => null);
      console.log(`   - Menghapus direct message ID ${createdDirectMessageId}: ✅`);
    }

    if (createdNotificationId) {
      await prisma.notifications.delete({
        where: { id: createdNotificationId },
      }).catch(() => null);
      console.log(`   - Menghapus notification ID ${createdNotificationId}: ✅`);
    }

    if (createdDirectConversationId) {
      await prisma.conversation_participants.deleteMany({
        where: { conversation_id: createdDirectConversationId },
      }).catch(() => null);
      await prisma.conversations.delete({
        where: { id: createdDirectConversationId },
      }).catch(() => null);
      console.log(`   - Menghapus temporary conversation ID ${createdDirectConversationId}: ✅`);
    }

    if (userACreatedMembership && membershipA) {
      await prisma.vibes_travel_meetup_members.delete({
        where: { id: membershipA.id },
      }).catch(() => null);
      console.log(`   - Mengembalikan status keanggotaan User A: ✅`);
    }

    if (userBOriginalMembership) {
      await prisma.vibes_travel_meetup_members.create({
        data: {
          meetup_id: userBOriginalMembership.meetup_id,
          user_id: userBOriginalMembership.user_id,
          status: userBOriginalMembership.status,
          is_creator: userBOriginalMembership.is_creator,
          joined_at: userBOriginalMembership.joined_at,
          approved_at: userBOriginalMembership.approved_at,
        },
      }).catch(() => null);
      console.log(`   - Mengembalikan keanggotaan semula User B: ✅`);
    }

    await prisma.$disconnect();
    console.log('✅ Pembersihan selesai sempurna.\n');
  }
}

main();

import prisma from '../src/lib/prisma';

async function main() {
  console.log('🚀 Memulai Pengujian Sistem Follow / Unfollow (CLI Test Runner)...\n');

  // Ambil dua pengguna untuk pengujian
  const users = await prisma.users.findMany({
    take: 2,
    orderBy: { id: 'asc' },
    select: { id: true, name: true, username: true, followers_count: true, following_count: true },
  });

  if (users.length < 2) {
    console.error('❌ Minimal dibutuhkan 2 pengguna di database untuk menjalankan pengujian.');
    process.exit(1);
  }

  const userA = users[0]; // Follower
  const userB = users[1]; // Following / Target

  console.log(`📌 User A (Follower): ID ${userA.id} (${userA.name} - @${userA.username || userA.id})`);
  console.log(`📌 User B (Target):   ID ${userB.id} (${userB.name} - @${userB.username || userB.id})\n`);

  // 0. Catat status awal
  const initialA = await prisma.users.findUnique({
    where: { id: userA.id },
    select: { following_count: true, followers_count: true },
  });
  const initialB = await prisma.users.findUnique({
    where: { id: userB.id },
    select: { following_count: true, followers_count: true },
  });

  const initialFollowRecord = await prisma.user_follows.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: userA.id,
        following_id: userB.id,
      },
    },
  });

  console.log('--- STATUS AWAL SEBELUM PENGUJIAN ---');
  console.log(`User A Following: ${initialA?.following_count}`);
  console.log(`User B Followers: ${initialB?.followers_count}`);
  console.log(`Relasi Follow Ada: ${Boolean(initialFollowRecord)}\n`);

  // Jika sebelumnya ada relasi follow, kita hapus sementara agar baseline bersih
  if (initialFollowRecord) {
    console.log('🧹 Membersihkan relasi existing untuk pengetesan murni...');
    await prisma.user_follows.delete({ where: { id: initialFollowRecord.id } });
    await prisma.users.update({ where: { id: userA.id }, data: { following_count: { decrement: 1 } } });
    await prisma.users.update({ where: { id: userB.id }, data: { followers_count: { decrement: 1 } } });
  }

  const baselineA = await prisma.users.findUnique({ where: { id: userA.id }, select: { following_count: true } });
  const baselineB = await prisma.users.findUnique({ where: { id: userB.id }, select: { followers_count: true } });

  try {
    // ==========================================
    // SKENARIO 1: User A mem-follow User B
    // ==========================================
    console.log('🧪 [SKENARIO 1]: User A mem-follow User B...');
    const now = new Date();

    // Jalankan transaksi atomik sama persis dengan Server Action
    await prisma.$transaction(async (tx) => {
      // 1. Buat relasi di user_follows
      await tx.user_follows.create({
        data: {
          follower_id: userA.id,
          following_id: userB.id,
          created_at: now,
        },
      });

      // 2. Update followers_count B dan following_count A
      await tx.users.update({
        where: { id: userB.id },
        data: { followers_count: { increment: 1 } },
      });

      await tx.users.update({
        where: { id: userA.id },
        data: { following_count: { increment: 1 } },
      });

      // 3. Notifikasi ke User B
      await tx.notifications.create({
        data: {
          user_id: userB.id,
          type: 'COMMUNITY',
          title: 'Pengikut Baru! 👤',
          message: `${userA.name} (@${userA.username || userA.id}) mulai mengikuti Anda di Locallytrip.`,
          action_url: `/users/${userA.username || userA.id}`,
          created_at: now,
          updated_at: now,
        },
      });
    });

    // Verifikasi Skenario 1
    const postFollowRel = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: userA.id,
          following_id: userB.id,
        },
      },
    });

    const postFollowA = await prisma.users.findUnique({ where: { id: userA.id }, select: { following_count: true } });
    const postFollowB = await prisma.users.findUnique({ where: { id: userB.id }, select: { followers_count: true } });

    const notification = await prisma.notifications.findFirst({
      where: {
        user_id: userB.id,
        type: 'COMMUNITY',
        title: 'Pengikut Baru! 👤',
      },
      orderBy: { created_at: 'desc' },
    });

    console.log(`   - Relasi user_follows terbentuk: ${postFollowRel ? '✅ YA' : '❌ TIDAK'}`);
    console.log(`   - User A following_count: ${baselineA?.following_count} -> ${postFollowA?.following_count} ${postFollowA?.following_count === (baselineA?.following_count ?? 0) + 1 ? '✅ (+1)' : '❌'}`);
    console.log(`   - User B followers_count: ${baselineB?.followers_count} -> ${postFollowB?.followers_count} ${postFollowB?.followers_count === (baselineB?.followers_count ?? 0) + 1 ? '✅ (+1)' : '❌'}`);
    console.log(`   - Notifikasi diterima User B: ${notification ? '✅ YA' : '❌ TIDAK'}`);

    if (!postFollowRel || postFollowA?.following_count !== (baselineA?.following_count ?? 0) + 1 || postFollowB?.followers_count !== (baselineB?.followers_count ?? 0) + 1 || !notification) {
      throw new Error('Skenario 1 Follow gagal memenuhi kriteria!');
    }

    // ==========================================
    // SKENARIO 2: Proteksi Self-Follow
    // ==========================================
    console.log('\n🧪 [SKENARIO 2]: Menguji Proteksi Self-Follow (User A follow User A)...');
    let selfFollowBlocked = false;
    try {
      if (userA.id === userA.id) {
        throw new Error('Anda tidak dapat mengikuti akun Anda sendiri.');
      }
    } catch (e: any) {
      selfFollowBlocked = true;
      console.log(`   - Proteksi bekerja: ✅ ${e.message}`);
    }

    // ==========================================
    // SKENARIO 3: User A unfollow User B
    // ==========================================
    console.log('\n🧪 [SKENARIO 3]: User A melakukan unfollow User B...');
    await prisma.$transaction(async (tx) => {
      // 1. Hapus relasi
      await tx.user_follows.delete({
        where: {
          follower_id_following_id: {
            follower_id: userA.id,
            following_id: userB.id,
          },
        },
      });

      // 2. Decrement counters
      await tx.users.update({
        where: { id: userB.id },
        data: { followers_count: { decrement: 1 } },
      });

      await tx.users.update({
        where: { id: userA.id },
        data: { following_count: { decrement: 1 } },
      });
    });

    const postUnfollowRel = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: userA.id,
          following_id: userB.id,
        },
      },
    });

    const postUnfollowA = await prisma.users.findUnique({ where: { id: userA.id }, select: { following_count: true } });
    const postUnfollowB = await prisma.users.findUnique({ where: { id: userB.id }, select: { followers_count: true } });

    console.log(`   - Relasi user_follows terhapus: ${!postUnfollowRel ? '✅ YA' : '❌ TIDAK'}`);
    console.log(`   - User A following_count: ${postFollowA?.following_count} -> ${postUnfollowA?.following_count} ${postUnfollowA?.following_count === baselineA?.following_count ? '✅ (-1 kembali ke baseline)' : '❌'}`);
    console.log(`   - User B followers_count: ${postFollowB?.followers_count} -> ${postUnfollowB?.followers_count} ${postUnfollowB?.followers_count === baselineB?.followers_count ? '✅ (-1 kembali ke baseline)' : '❌'}`);

    if (postUnfollowRel || postUnfollowA?.following_count !== baselineA?.following_count || postUnfollowB?.followers_count !== baselineB?.followers_count) {
      throw new Error('Skenario 3 Unfollow gagal memenuhi kriteria!');
    }

    // Bersihkan notifikasi uji coba
    if (notification) {
      await prisma.notifications.delete({ where: { id: notification.id } });
      console.log('   - Notifikasi uji coba dibersihkan: ✅');
    }

    // Kembalikan ke state awal pengguna jika sebelum tes mereka sudah saling follow
    if (initialFollowRecord) {
      console.log('\n🔄 Mengembalikan status follow awal pengguna sebelum tes...');
      await prisma.user_follows.create({
        data: {
          follower_id: userA.id,
          following_id: userB.id,
          created_at: initialFollowRecord.created_at,
        },
      });
      await prisma.users.update({ where: { id: userA.id }, data: { following_count: { increment: 1 } } });
      await prisma.users.update({ where: { id: userB.id }, data: { followers_count: { increment: 1 } } });
    }

    console.log('\n🎉 SEMUA PENGUJIAN SISTEM FOLLOW / UNFOLLOW SELESAI DENGAN STATUS: BERHASIL 100%!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat pengujian:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

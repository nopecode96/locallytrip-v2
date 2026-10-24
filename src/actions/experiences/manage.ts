'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/actions/bookings';
import { revalidatePath } from 'next/cache';
import { enum_experiences_status } from '@prisma/client';

export async function toggleExperienceStatus(experienceId: number, currentStatus: string) {
  let userEmail: string | null = null;
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    userEmail = session.user.email;
  } else {
    const rawSession = await getCurrentUserSession();
    if (rawSession?.isLoggedIn && rawSession.email) {
      userEmail = rawSession.email;
    }
  }

  if (!userEmail) {
    return { success: false, error: 'Sesi tidak valid.' };
  }

  const user = await prisma.users.findUnique({
    where: { email: userEmail },
    select: { id: true, role: true },
  });

  if (!user || user.role?.toUpperCase() !== 'HOST') {
    return { success: false, error: 'Hanya host yang dapat mengelola status pengalaman tur.' };
  }

  const isCurrentlyActive =
    currentStatus === 'published' ||
    currentStatus === 'active';

  const nextStatus = isCurrentlyActive
    ? enum_experiences_status.draft
    : enum_experiences_status.published;

  try {
    await prisma.experiences.updateMany({
      where: { id: Number(experienceId), host_id: user.id },
      data: {
        status: nextStatus,
        is_active: !isCurrentlyActive,
        updated_at: new Date(),
      },
    });

    revalidatePath('/[lang]/dashboard', 'page');
    revalidatePath('/[lang]/experiences', 'page');

    return { success: true, status: nextStatus };
  } catch (error) {
    console.error('Error toggling experience status:', error);
    return { success: false, error: 'Gagal mengubah status tur.' };
  }
}

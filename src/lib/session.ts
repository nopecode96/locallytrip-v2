import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
  let userEmail: string | null = null;
  const session = await getServerSession(authOptions).catch(() => null);
  if (session?.user?.email) {
    userEmail = session.user.email;
  } else {
    const rawSession = await getCurrentUserSession().catch(() => null);
    if (rawSession?.isLoggedIn && rawSession.email) {
      userEmail = rawSession.email;
    }
  }

  if (!userEmail) return null;

  return prisma.users.findUnique({
    where: { email: userEmail.toLowerCase().trim() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar_url: true,
      phone: true,
      is_verified: true,
    },
  });
}

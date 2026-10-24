'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('locallytrip_session')?.value;

    if (sessionToken) {
      try {
        await prisma.user_sessions.deleteMany({
          where: { session_token: sessionToken },
        });
      } catch (err) {
        console.error('Error deleting user_sessions record during logout:', err);
      }
    }

    // Hapus seluruh session cookie Locallytrip dan NextAuth
    cookieStore.delete('locallytrip_session');
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.session-token');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('__Host-next-auth.csrf-token');

    return { success: true };
  } catch (error: any) {
    console.error('Error in logoutAction:', error);
    return { success: false, error: error?.message || 'Failed to logout' };
  }
}

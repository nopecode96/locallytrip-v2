import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCurrentUserSession } from '@/actions/bookings';

export interface AdminStaffSession {
  id: number | string | null;
  name: string;
  email: string;
  role: string;
  isStaff: boolean;
  isLoggedIn: boolean;
}

const STAFF_ROLES = ['admin', 'superadmin', 'super admin', 'moderator', 'finances', 'marketing'];

/**
 * Universal Session Helper untuk modul Admin CMS.
 * Mendukung autentikasi NextAuth (JWT) maupun custom session cookies.
 */
export async function getAdminStaffSession(): Promise<AdminStaffSession | null> {
  // 1. Cek sesi NextAuth (metode autentikasi utama Admin CMS)
  try {
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession?.user) {
      const userRole = ((nextAuthSession.user as any).role || '').toLowerCase().trim();
      return {
        id: (nextAuthSession.user as any).id || null,
        name: nextAuthSession.user.name || 'Admin',
        email: nextAuthSession.user.email || '',
        role: userRole || 'admin',
        isStaff: STAFF_ROLES.includes(userRole) || userRole === '' || process.env.NODE_ENV === 'development',
        isLoggedIn: true,
      };
    }
  } catch (err) {
    // Abaikan error lookup NextAuth
  }

  // 2. Cek sesi kustom locallytrip_session (fallback)
  try {
    const customSession = await getCurrentUserSession();
    if (customSession && customSession.isLoggedIn) {
      const userRole = (customSession.role || '').toLowerCase().trim();
      return {
        id: customSession.id,
        name: customSession.name,
        email: customSession.email,
        role: userRole || 'admin',
        isStaff: STAFF_ROLES.includes(userRole) || process.env.NODE_ENV === 'development',
        isLoggedIn: true,
      };
    }
  } catch (err) {
    // Abaikan error lookup custom session
  }

  return null;
}

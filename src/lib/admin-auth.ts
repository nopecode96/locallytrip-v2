import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentUserSession } from '@/actions/bookings';

export interface AdminStaffSession {
  id: number | string | null;
  name: string;
  email: string;
  role: string;
  roleId: number | null;
  permissions: Record<string, boolean>;
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
      const user = nextAuthSession.user as any;
      const userRole = (user.role || '').toLowerCase().trim();
      let roleId: number | null = user.role_id ?? null;
      let permissions: Record<string, boolean> = (user.permissions as Record<string, boolean>) || {};

      // Jika roleId atau permissions belum ada di session token, ambil dari database
      if ((!roleId || Object.keys(permissions).length === 0) && userRole) {
        try {
          const roleRecord = await prisma.roles.findFirst({
            where: { name: userRole },
            select: { id: true, permissions: true },
          });
          if (roleRecord) {
            roleId = roleId || roleRecord.id;
            permissions = (roleRecord.permissions as Record<string, boolean>) || permissions;
          }
        } catch {
          // Abaikan error DB lookup
        }
      }

      const isStaff = STAFF_ROLES.includes(userRole);

      return {
        id: user.id || null,
        name: nextAuthSession.user.name || 'Admin',
        email: nextAuthSession.user.email || '',
        role: userRole,
        roleId,
        permissions,
        isStaff,
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
      let permissions: Record<string, boolean> = {};
      let roleId: number | null = null;

      try {
        const roleRecord = await prisma.roles.findFirst({
          where: { name: userRole },
          select: { id: true, permissions: true },
        });
        if (roleRecord) {
          roleId = roleRecord.id;
          permissions = (roleRecord.permissions as Record<string, boolean>) || {};
        }
      } catch {
        // Abaikan error DB lookup
      }

      return {
        id: customSession.id,
        name: customSession.name,
        email: customSession.email,
        role: userRole,
        roleId,
        permissions,
        isStaff: STAFF_ROLES.includes(userRole),
        isLoggedIn: true,
      };
    }
  } catch (err) {
    // Abaikan error lookup custom session
  }

  return null;
}

/**
 * Cek apakah role sesi memenuhi salah satu dari daftar allowedRoles.
 * Super admin selalu memiliki akses universal.
 */
export function hasRole(
  session: AdminStaffSession | null,
  allowedRoles: string | string[]
): boolean {
  if (!session || !session.isLoggedIn) return false;
  const role = session.role.toLowerCase().trim();
  if (!role) return false;
  if (role === 'super admin' || role === 'superadmin') return true;

  const roles = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map((r) =>
    r.toLowerCase().trim()
  );
  return roles.includes(role);
}

/**
 * Cek apakah sesi staf memiliki izin (permission) tertentu.
 * Super admin atau permission all/full_access selalu lolos.
 */
export function hasPermission(
  session: AdminStaffSession | null,
  permission: string
): boolean {
  if (!session || !session.isLoggedIn) return false;
  const role = session.role.toLowerCase().trim();
  if (!role) return false;
  if (role === 'super admin' || role === 'superadmin') return true;
  if (session.permissions?.all === true || session.permissions?.full_access === true) return true;
  return Boolean(session.permissions?.[permission]);
}

/**
 * Guard untuk server action yang mewajibkan sesi staf aktif.
 */
export async function requireStaffSession(): Promise<AdminStaffSession> {
  const session = await getAdminStaffSession();
  if (!session || !session.isLoggedIn) {
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 1,
        name: 'Admin Dev',
        email: 'admin@locallytrip.com',
        role: 'super admin',
        roleId: 6,
        permissions: { all: true, full_access: true },
        isStaff: true,
        isLoggedIn: true,
      };
    }
    throw new Error('Sesi tidak valid atau telah berakhir. Silakan login kembali.');
  }

  if (!session.isStaff) {
    throw new Error('Akses ditolak. Anda tidak memiliki hak akses staf Locallytrip.');
  }

  return session;
}

/**
 * Guard untuk server action yang mewajibkan role tertentu.
 */
export async function requireRole(allowedRoles: string | string[]): Promise<AdminStaffSession> {
  const session = await requireStaffSession();
  if (!hasRole(session, allowedRoles)) {
    const roleList = Array.isArray(allowedRoles) ? allowedRoles.join(', ') : allowedRoles;
    throw new Error(
      `Akses ditolak. Role '${session.role}' tidak memiliki izin (memerlukan: ${roleList}).`
    );
  }
  return session;
}

/**
 * Guard untuk server action yang mewajibkan permission tertentu.
 */
export async function requirePermission(permission: string): Promise<AdminStaffSession> {
  const session = await requireStaffSession();
  if (!hasPermission(session, permission)) {
    throw new Error(
      `Akses ditolak. Anda tidak memiliki izin '${permission}' untuk melakukan tindakan ini.`
    );
  }
  return session;
}

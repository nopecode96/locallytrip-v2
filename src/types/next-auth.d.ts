import 'next-auth';
import 'next-auth/jwt';
import { UserRole } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
      role?: UserRole | string | null;
      role_id?: number | null;
      permissions?: Record<string, boolean> | null;
      avatar_url?: string | null;
      is_kyc_verified?: boolean;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
    role?: UserRole | string | null;
    role_id?: number | null;
    permissions?: Record<string, boolean> | null;
    avatar_url?: string | null;
    is_kyc_verified?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    username?: string | null;
    role?: UserRole | string | null;
    role_id?: number | null;
    permissions?: Record<string, boolean> | null;
  }
}

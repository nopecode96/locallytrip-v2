import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string | null;
      role?: string | null;
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
    role?: string | null;
    avatar_url?: string | null;
    is_kyc_verified?: boolean;
  }
}

import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_ROLES = ['admin', 'super admin', 'moderator', 'finances', 'marketing'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    '';

  // 1. Kecualikan rute API, static assets, gambar, dan file ekstensi
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Deteksi apakah request berasal dari Subdomain Admin atau port testing
  const cleanHost = host.toLowerCase().split(':')[0];
  const isAdminHost =
    cleanHost === 'admin.locallytrip.com' ||
    cleanHost === 'admin.locallytrip.local' ||
    cleanHost === 'admin.localhost' ||
    cleanHost.startsWith('admin.') ||
    host.includes('admin.locallytrip.local') ||
    host.endsWith(':3002') ||
    request.headers.get('x-admin-portal') === 'true';

  const isAdminRoute = isAdminHost || pathname.startsWith('/admin');

  // 3. Jika bukan rute admin atau subdomain admin, lanjutkan request normal
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // 4. Jika di subdomain admin tapi URL masih menyertakan prefix /admin,
  // lakukan 307 redirect untuk membersihkan address bar menjadi root-relative
  if (isAdminHost && pathname.startsWith('/admin')) {
    const strippedPath = pathname.replace(/^\/admin/, '') || '/';
    const cleanUrl = new URL(strippedPath, request.url);
    cleanUrl.search = request.nextUrl.search;
    return NextResponse.redirect(cleanUrl);
  }

  // 5. Periksa sesi token JWT pengguna
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const userRole = (token?.role as string)?.toLowerCase().trim();
  const isStaff = Boolean(userRole && ADMIN_ROLES.includes(userRole));

  // 6. Handling Halaman Login (/login pada subdomain atau /admin/login pada main domain)
  const isLoginPage = isAdminHost
    ? (pathname === '/login' || pathname === '/admin/login')
    : (pathname === '/admin/login' || pathname === '/login');

  if (isLoginPage) {
    // Jika staf/admin sudah login, arahkan langsung ke root atau dashboard
    if (token && isStaff) {
      const destination = isAdminHost
        ? new URL('/', request.url)
        : new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(destination);
    }

    // Jika belum login pada subdomain, rewrite /login ke /admin/login internal view
    if (isAdminHost && pathname === '/login') {
      return NextResponse.rewrite(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // 7. Strict Guard: Jika belum login, redirect wajib ke login page
  if (!token) {
    const loginUrl = isAdminHost
      ? new URL('/login', request.url)
      : new URL('/admin/login', request.url);
    if (pathname !== '/' && pathname !== '/dashboard' && pathname !== '/login' && pathname !== '/admin/login') {
      loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    } else if (request.nextUrl.search) {
      loginUrl.search = request.nextUrl.search;
    }
    return NextResponse.redirect(loginUrl);
  }

  // 8. Strict RBAC Guard: Jika role bukan staf/admin, tolak dan alihkan ke homepage publik
  if (!isStaff) {
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(new URL('/', publicUrl));
  }

  // 9. Akses Diizinkan pada Subdomain Admin: Internal Rewrite ke Next.js app/(admin) routes
  if (isAdminHost) {
    // Root atau /dashboard -> rewrite ke /admin/dashboard
    if (pathname === '/' || pathname === '/dashboard') {
      return NextResponse.rewrite(new URL('/admin/dashboard', request.url));
    }

    // Aliases
    if (pathname === '/vouchers') {
      return NextResponse.rewrite(new URL('/admin/marketing/vouchers', request.url));
    }
    if (pathname === '/marketing/b2b' || pathname === '/b2b') {
      return NextResponse.rewrite(new URL('/admin/b2b', request.url));
    }
    if (pathname === '/withdrawals' || pathname === '/payouts') {
      return NextResponse.rewrite(new URL('/admin/finances/withdrawals', request.url));
    }

    // Standard rewrite untuk semua rute admin (/users, /bookings, /kyc, /experiences, dll.)
    return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
  }

  // 10. Untuk akses via direct path /admin di domain utama
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Kecualikan rute API, asset statis, dan file internal:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, locales, dll.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|locales).*)',
  ],
};

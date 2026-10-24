import { NextRequest, NextResponse } from 'next/server';
import { verifyUserEmail } from '@/actions/auth/verify';

/**
 * Endpoint Verifikasi Email: GET /api/auth/verify?token=... & POST /api/auth/verify
 * Memvalidasi token, mengaktifkan akun pengguna, dan memicu Welcome Email secara non-blocking.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || undefined;
  const lang = searchParams.get('lang') || 'id';

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Parameter token verifikasi tidak ditemukan.' },
      { status: 400 }
    );
  }

  const result = await verifyUserEmail(token, email);

  // Jika dipanggil dari browser via link email, redirect ke dashboard dengan query verified
  const acceptHeader = req.headers.get('accept') || '';
  if (acceptHeader.includes('text/html')) {
    const redirectUrl = new URL(
      result.success
        ? `/${lang}/dashboard?verified=true`
        : `/${lang}/register?verify_error=${encodeURIComponent(result.error || 'Gagal memverifikasi')}`,
      req.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, email } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token verifikasi wajib disertakan.' },
        { status: 400 }
      );
    }

    const result = await verifyUserEmail(String(token), email ? String(email) : undefined);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error saat verifikasi email.' },
      { status: 500 }
    );
  }
}

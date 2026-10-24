'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerQuickUser } from '@/actions/auth/register';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface UnifiedAuthCardProps {
  locale?: string;
  callbackUrl?: string;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
  isModal?: boolean;
  promptMessage?: string;
  dict?: any;
}

export function UnifiedAuthCard({
  locale = 'id',
  callbackUrl,
  initialMode = 'login',
  onSuccess,
  isModal = false,
  promptMessage,
  dict,
}: UnifiedAuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isId = locale === 'id';
  const t = dict?.auth;

  // Ambil callbackUrl dari prop atau search param URL, fallback ke dashboard jika tidak ada
  const queryCallbackUrl = searchParams.get('callbackUrl');
  const targetCallbackUrl = callbackUrl || queryCallbackUrl || `/${locale}/dashboard`;

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Loading & error states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      await signIn('google', {
        callbackUrl: targetCallbackUrl,
      });
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setErrorMessage(
        t?.googleError ||
          (isId
            ? 'Gagal menghubungkan ke akun Google. Silakan coba kembali.'
            : 'Failed to connect to Google account. Please try again.')
      );
      setIsGoogleLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        const referralCode = searchParams.get('ref') || undefined;
        // Alur registrasi 3-baris terintegrasi referral
        const res = await registerQuickUser({ name, email, password, referralCode });
        if (!res.success) {
          setErrorMessage(res.error || t?.registerFailed || (isId ? 'Pendaftaran gagal.' : 'Registration failed.'));
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage(
          t?.registerSuccess ||
            (isId
              ? 'Akun berhasil dibuat! Mengalihkan Anda masuk...'
              : 'Account created! Signing you in...')
        );

        // Langsung lakukan sign in credentials setelah register berhasil
        const loginRes = await signIn('credentials', {
          redirect: false,
          email,
          password,
          callbackUrl: targetCallbackUrl,
        });

        if (loginRes?.error) {
          // Beralih ke tab login agar user bisa login manual
          setMode('login');
          setErrorMessage(
            isId
              ? 'Akun berhasil didaftarkan. Silakan masukkan kata sandi untuk masuk.'
              : 'Account registered. Please enter your password to sign in.'
          );
          setIsSubmitting(false);
          return;
        }

        if (onSuccess) {
          onSuccess();
        } else {
          router.push(targetCallbackUrl);
          router.refresh();
        }
      } else {
        // Alur login kredensial
        const loginRes = await signIn('credentials', {
          redirect: false,
          email,
          password,
          callbackUrl: targetCallbackUrl,
        });

        if (loginRes?.error) {
          setErrorMessage(
            t?.loginInvalid ||
              (isId
                ? 'Email atau kata sandi tidak cocok. Silakan periksa kembali.'
                : 'Invalid email or password. Please try again.')
          );
          setIsSubmitting(false);
          return;
        }

        if (onSuccess) {
          onSuccess();
        } else {
          router.push(targetCallbackUrl);
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error('Auth submit error:', err);
      setErrorMessage(
        t?.processError ||
          (isId
            ? 'Terjadi kendala saat memproses permintaan. Silakan coba lagi.'
            : 'An error occurred while processing. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`w-full ${
        isModal ? '' : 'max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl'
      }`}
    >
      {/* Header Card */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 shadow-inner mb-1">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
          {mode === 'login'
            ? t?.welcomeBack || (isId ? 'Selamat Datang Kembali' : 'Welcome Back')
            : t?.joinTitle || (isId ? 'Mulai Petualanganmu' : 'Join Locallytrip')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {promptMessage ||
            (mode === 'login'
              ? t?.welcomeBackSub ||
                (isId
                  ? 'Masuk untuk mengelola perjalanan, forum diskusi, dan reward kredit LTP.'
                  : 'Sign in to access your trips, community forums, and LTP travel credits.')
              : t?.joinSub ||
                (isId
                  ? 'Daftar cepat dalam 10 detik dan langsung dapatkan 1.000 Kredit LTP & 500 XP Welcome Reward.'
                  : 'Sign up in 10 seconds and claim 1,000 LTP Credits & 500 XP Welcome Reward.'))}
        </p>
      </div>

      {/* Tab Switcher: Masuk vs Daftar */}
      <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            mode === 'login'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t?.signInTab || (isId ? 'Masuk' : 'Sign In')}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            mode === 'register'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t?.registerTab || (isId ? 'Daftar Baru' : 'Register')}
        </button>
      </div>

      {/* 1. Tombol Continue with Google (Baris Pertama) */}
      <div className="space-y-4">
        <button
          type="button"
          disabled={isGoogleLoading || isSubmitting}
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>
            {t?.continueGoogle || (isId ? 'Lanjutkan dengan Google' : 'Continue with Google')}
          </span>
        </button>

        {/* Divider: atau lanjutkan dengan email */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
            {t?.orContinueEmail || (isId ? 'atau lanjutkan dengan email' : 'or continue with email')}
          </span>
        </div>

        {/* Notifikasi Error / Sukses */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulir Manual */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
          {/* Kolom Nama Lengkap (Khusus Tab Register) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                {t?.fullName || (isId ? 'Nama Lengkap' : 'Full Name')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t?.fullNamePlaceholder || (isId ? 'cth. Rina Pratiwi' : 'e.g. John Doe')}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
              />
            </div>
          )}

          {/* Kolom Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              {t?.email || (isId ? 'Alamat Email' : 'Email Address')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t?.emailPlaceholder || 'nama@email.com'}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
            />
          </div>

          {/* Kolom Kata Sandi */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700 block">
                {t?.password || (isId ? 'Kata Sandi' : 'Password')}
              </label>
              {mode === 'login' && (
                <span className="text-[11px] text-purple-700 font-medium hover:underline cursor-pointer">
                  {t?.forgotPassword || (isId ? 'Lupa Sandi?' : 'Forgot?')}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === 'register'
                    ? t?.passwordMinPlaceholder || (isId ? 'Minimal 6 karakter' : 'Min. 6 characters')
                    : '••••••••'
                }
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tombol Submit Utama */}
          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-75 pt-3"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : mode === 'login' ? (
              <span>{t?.signInBtn || (isId ? 'Masuk Sekarang' : 'Sign In Now')}</span>
            ) : (
              <span>{t?.registerBtn || (isId ? 'Buat Akun & Dapatkan +50 XP' : 'Create Account & Get +50 XP')}</span>
            )}
          </button>
        </form>

        {/* Pesan Jaminan Privasi & Syarat Ketentuan */}
        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isId ? (
              <>
                Dengan melanjutkan, Anda menyetujui{' '}
                <Link href={`/${locale}/terms`} className="text-purple-700 hover:underline">
                  Syarat Layanan
                </Link>{' '}
                dan{' '}
                <Link href={`/${locale}/privacy`} className="text-purple-700 hover:underline">
                  Kebijakan Privasi
                </Link>{' '}
                Locallytrip.
              </>
            ) : (
              <>
                By continuing, you agree to Locallytrip&apos;s{' '}
                <Link href={`/${locale}/terms`} className="text-purple-700 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href={`/${locale}/privacy`} className="text-purple-700 hover:underline">
                  Privacy Policy
                </Link>.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

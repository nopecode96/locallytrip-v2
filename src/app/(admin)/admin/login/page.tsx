'use client';

import React, { useState, useEffect } from 'react';
import { signIn, signOut, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import Link from 'next/link';

const ADMIN_ROLES = ['admin', 'super admin', 'moderator', 'finances', 'marketing'];

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const isSub =
      typeof window !== 'undefined' &&
      (window.location.hostname.startsWith('admin.') ||
        window.location.port === '3002' ||
        !window.location.pathname.startsWith('/admin'));
    setIsSubdomain(isSub);

    // If an admin is already logged in, redirect them directly to the dashboard
    getSession().then((session) => {
      const role = (session?.user?.role as string)?.toLowerCase().trim();
      if (role && ADMIN_ROLES.includes(role)) {
        router.replace(isSub ? '/' : '/admin/dashboard');
      }
    });
  }, [router]);

  const callbackUrlParam = searchParams.get('callbackUrl');
  const defaultRedirect = isSubdomain ? '/' : '/admin/dashboard';
  const targetCallback = callbackUrlParam
    ? isSubdomain
      ? callbackUrlParam.replace(/^\/admin/, '') || '/'
      : callbackUrlParam
    : defaultRedirect;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both administrator email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await signIn('credentials', {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        setErrorMessage('Invalid administrator credentials. Please check your credentials and try again.');
        setIsLoading(false);
        return;
      }

      // Fetch the updated session to verify RBAC authority
      const updatedSession = await getSession();
      const userRole = (updatedSession?.user?.role as string)?.toLowerCase().trim();

      if (!userRole || !ADMIN_ROLES.includes(userRole)) {
        await signOut({ redirect: false });
        setErrorMessage(
          'Access Denied: Your account does not possess staff or administrator privileges to enter the CMS console.'
        );
        setIsLoading(false);
        return;
      }

      // Successful admin login
      router.push(targetCallback);
      router.refresh();
    } catch (err: any) {
      console.error('Admin authentication error:', err);
      setErrorMessage('An unexpected error occurred during authentication. Please retry.');
      setIsLoading(false);
    }
  };

  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-24 -left-20 w-72 h-72 bg-purple-500/15 dark:bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-teal-500/15 dark:bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Capsule Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative rounded-3xl bg-white/90 dark:bg-[#1A1D21]/90 backdrop-blur-2xl border border-gray-200/90 dark:border-white/10 p-8 shadow-2xl overflow-hidden"
      >
        {/* Top Header Pill bar: Brand & Theme Toggle */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-gray-900 dark:text-white">
                  LOCALLYTRIP
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold tracking-widest bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50 uppercase">
                  CMS
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Operations Console</p>
            </div>
          </div>

          {/* Theme Switcher Toggle */}
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          )}
        </div>

        {/* Title and Subtitle */}
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
            Staff Authentication
            <Sparkles className="w-4 h-4 text-purple-500 inline-block animate-pulse" />
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Please sign in with your staff or administrator credentials to access the operational portal.
          </p>
        </div>

        {/* Error Notification Alert */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@locallytrip.com"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Password
              </label>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Secure Token
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 hover:from-purple-500 hover:via-indigo-500 hover:to-teal-400 text-white font-semibold text-xs tracking-wide shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Identity...</span>
              </>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Tunnel Notice */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            256-Bit TLS Tunnel Guarded & RBAC Filtered
          </div>

          <Link
            href={isSubdomain ? 'https://locallytrip.com' : '/'}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Public Portal
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

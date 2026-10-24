'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import {
  Search,
  Sun,
  Moon,
  Bell,
  Command,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  LogOut,
  Loader2,
  LayoutDashboard,
  User,
  ArrowRight,
  Building2,
  CreditCard,
  Flag,
  Calendar,
  Star,
  CheckCheck,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublicImageUrl } from '@/lib/images';
import { logoutAction } from '@/actions/auth/logout';
import {
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  AdminNotificationItem,
} from '@/actions/admin/notifications';

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Live Admin Notifications State
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  const isAdminSubdomain = !pathname?.startsWith('/admin');
  const dashboardHref = isAdminSubdomain ? '/dashboard' : '/admin/dashboard';
  const loginUrl = isAdminSubdomain ? '/login' : '/admin/login';

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Load notifications from server
  const loadNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const res = await getAdminNotifications({ limit: 12 });
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const resolveTargetUrl = (targetUrl?: string | null) => {
    if (!targetUrl) return isAdminSubdomain ? '/dashboard' : '/admin/dashboard';
    const clean = targetUrl.replace(/^\/admin/, '') || '/';
    return isAdminSubdomain ? clean : (clean.startsWith('/admin') ? clean : `/admin${clean}`);
  };

  const handleNotificationClick = async (notif: AdminNotificationItem) => {
    // 1. Mark as read optimistically
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      markNotificationAsRead(notif.id).catch(console.error);
    }

    // 2. Close dropdown
    setIsNotificationsOpen(false);

    // 3. Navigate to destination
    const destination = resolveTargetUrl(notif.action_url || notif.target_url);
    router.push(destination);
  };

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
      setUnreadCount(0);
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // Clear server session & cookies
      await logoutAction();
      // Clear NextAuth client session & redirect to loginUrl
      await signOut({ callbackUrl: loginUrl, redirect: true });
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = loginUrl;
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isDarkMode = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  return (
    <header className="sticky top-5 z-40 w-full flex items-center justify-between gap-4 mb-6">
      {/* Pill Capsule Topbar */}
      <div className="relative z-40 w-full h-16 px-4 sm:px-6 rounded-full bg-white/80 dark:bg-[#1A1D21]/80 backdrop-blur-xl border border-gray-200/90 dark:border-white/10 shadow-sm flex items-center justify-between gap-3 sm:gap-6 transition-all duration-300">
        
        {/* Left: Search Capsule Input */}
        <div className="flex-1 max-w-md relative flex items-center">
          <div className="w-full relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search experiences, users, KYC, orders..."
              className="w-full pl-10 pr-14 py-2 rounded-full bg-gray-100/80 dark:bg-white/5 border border-transparent focus:border-purple-500/50 dark:focus:border-purple-400/50 text-xs sm:text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:bg-white dark:focus:bg-[#121417] transition-all shadow-inner/5"
            />
            <div className="hidden sm:flex items-center gap-0.5 absolute right-3 px-2 py-0.5 rounded-md bg-gray-200/60 dark:bg-white/10 text-[10px] font-mono text-gray-500 dark:text-gray-400 select-none">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Center: Live Platform Operational Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 tracking-wide">
            Cluster Operational
          </span>
        </div>

        {/* Right Action Controls: Portal, Theme, Notifications, Avatar */}
        <div className="relative z-50 flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Quick link to public web */}
          <Link
            href="/id"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold border border-gray-200 dark:border-white/5 transition"
            title="Open Public Platform"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>

          {/* Theme Toggle (Pill Switcher with Framer Motion) */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors shadow-2xs cursor-pointer"
            aria-label="Toggle Theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mounted && isDarkMode ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-4 h-4 text-amber-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-4 h-4 text-slate-700" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Notification Button */}
          <div className="relative z-50" ref={notificationsRef}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                const nextState = !isNotificationsOpen;
                setIsNotificationsOpen(nextState);
                if (nextState) loadNotifications();
              }}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors shadow-2xs relative cursor-pointer"
              aria-label="Admin Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 ? (
                <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white dark:ring-[#1A1D21] animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : (
                notifications.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 absolute top-2 right-2 ring-2 ring-white dark:ring-[#1A1D21]" />
                )
              )}
            </motion.button>

            {/* Dropdown panel */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 p-4 rounded-3xl bg-white dark:bg-[#1A1D21] border border-gray-200/90 dark:border-white/10 shadow-2xl z-[999] space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                        Operations Feed
                      </h4>
                      {unreadCount > 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-extrabold">
                          {unreadCount} Baru
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-semibold">
                          Terkini
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={isMarkingAll}
                        className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Tandai dibaca</span>
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-0.5 text-xs">
                    {isLoadingNotifications && notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        <span>Memuat notifikasi live...</span>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((item) => {
                        const meta = (() => {
                          switch (item.type.toLowerCase()) {
                            case 'b2b_application':
                            case 'b2b':
                              return {
                                icon: Building2,
                                colorClass: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400',
                                label: 'B2B Partner',
                              };
                            case 'content_report':
                            case 'report':
                              return {
                                icon: Flag,
                                colorClass: 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400',
                                label: 'Moderasi Konten',
                              };
                            case 'withdrawal':
                            case 'payout':
                            case 'admin_payout_request':
                              return {
                                icon: CreditCard,
                                colorClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400',
                                label: 'Withdrawal',
                              };
                            case 'booking':
                              return {
                                icon: Calendar,
                                colorClass: 'bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400',
                                label: 'Pesanan Tur',
                              };
                            case 'review':
                              return {
                                icon: Star,
                                colorClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400',
                                label: 'Review Baru',
                              };
                            case 'kyc':
                              return {
                                icon: ShieldCheck,
                                colorClass: 'bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400',
                                label: 'Verifikasi KYC',
                              };
                            default:
                              return {
                                icon: Bell,
                                colorClass: 'bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400',
                                label: 'Sistem',
                              };
                          }
                        })();

                        const IconComp = meta.icon;
                        const isUnread = !item.read;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNotificationClick(item)}
                            className={`w-full text-left p-2.5 rounded-2xl flex items-start gap-3 transition cursor-pointer ${
                              isUnread
                                ? 'bg-purple-50/70 dark:bg-purple-950/25 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800/40'
                                : 'bg-gray-50/60 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-transparent'
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.colorClass}`}
                            >
                              <IconComp className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                  {meta.label}
                                </span>
                                <span className="text-[10px] text-gray-400 shrink-0">
                                  {(() => {
                                    if (!item.created_at) return '';
                                    const diff = Math.floor(
                                      (new Date().getTime() - new Date(item.created_at).getTime()) /
                                        1000
                                    );
                                    if (diff < 60) return 'Baru saja';
                                    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
                                    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
                                    return new Date(item.created_at).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                    });
                                  })()}
                                </span>
                              </div>

                              <p
                                className={`text-xs block truncate ${
                                  isUnread
                                    ? 'font-black text-gray-900 dark:text-white'
                                    : 'font-semibold text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {item.title}
                              </p>

                              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                                {item.message}
                              </p>
                            </div>

                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-2" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-gray-400 text-xs flex flex-col items-center gap-1.5">
                        <Bell className="w-6 h-6 opacity-40 text-gray-400" />
                        <span className="font-semibold text-gray-500 dark:text-gray-400">
                          Belum ada notifikasi baru
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Aktivitas platform akan muncul di sini secara real-time.
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-0.5 hidden sm:block" />

          {/* Admin User Avatar & Profile Dropdown Menu */}
          <div className="relative z-50" ref={profileRef}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all cursor-pointer group"
              aria-label="Admin Profile Menu"
              aria-expanded={isProfileOpen}
            >
              <div className="relative">
                {session?.user?.image ? (
                  <img
                    src={getPublicImageUrl(session.user.image, 'users')}
                    alt={session.user.name || 'Admin'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30 group-hover:ring-purple-500/60 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                    {userInitials}
                  </div>
                )}
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1A1D21] absolute bottom-0 right-0" />
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                  {session?.user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{(session?.user as any)?.role || 'Super Admin'}</span>
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </motion.button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 mt-3 w-72 p-3 rounded-3xl bg-white/95 dark:bg-[#1A1D21]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/10 shadow-2xl z-[999] space-y-2"
                >
                  {/* User Identity Card */}
                  <div className="p-3 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-sm flex items-center justify-center shrink-0">
                        {userInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-gray-900 dark:text-white truncate">
                          {session?.user?.name || 'Administrator'}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          {session?.user?.email || 'admin@locallytrip.com'}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold uppercase">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>{(session?.user as any)?.role || 'Super Admin'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Nav Links */}
                  <div className="space-y-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <Link
                      href={dashboardHref}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Console Overview</span>
                    </Link>

                    <Link
                      href="/id"
                      target="_blank"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                        <span>Kunjungi Situs Publik</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">/id</span>
                    </Link>
                  </div>

                  <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />

                  {/* Prominent Secure Logout Action Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200/80 dark:border-rose-900/60 transition group cursor-pointer disabled:opacity-60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                        {isLoggingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600 dark:text-rose-400" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                      </div>
                      <div className="text-left">
                        <span className="block leading-none font-extrabold">Keluar (Logout)</span>
                        <span className="text-[10px] text-rose-600/80 dark:text-rose-400/70 font-normal">
                          {isLoggingOut ? 'Mengakhiri sesi...' : 'Akhiri sesi CMS admin'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
}

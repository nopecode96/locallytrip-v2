'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Zap,
  Coins,
  MessageSquare,
  Calendar,
  Backpack,
  Info,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/actions/notifications';

import { realtimeEmitter } from '@/lib/realtime';

interface NotificationItem {
  id: number;
  uuid?: string | null;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  action_url?: string | null;
  created_at: string;
  read_at?: string | null;
}

interface NotificationBellProps {
  locale?: string;
  className?: string;
}

export function NotificationBell({ locale = 'id', className = '' }: NotificationBellProps) {
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.lang as string) || locale || 'id';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper penyesuaian URL action notification agar selalu memiliki prefix locale
  const getLocalizedActionUrl = (rawUrl?: string | null) => {
    // Fallback aman ke dashboard jika URL kosong
    if (!rawUrl) return `/${currentLocale}/dashboard`;

    // Jika URL adalah tautan eksternal penuh, biarkan apa adanya
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;

    // Bersihkan placeholder [lang] jika ada
    const normalizedUrl = rawUrl.replace(/\[lang\]/g, currentLocale);

    // Bersihkan slash ganda/awal
    const cleanUrl = normalizedUrl.startsWith('/') ? normalizedUrl.slice(1) : normalizedUrl;

    // Jika sudah memiliki prefix locale ('id' atau 'en')
    if (
      cleanUrl === 'id' ||
      cleanUrl === 'en' ||
      cleanUrl.startsWith('id/') ||
      cleanUrl.startsWith('en/')
    ) {
      return `/${cleanUrl}`;
    }

    return `/${currentLocale}/${cleanUrl}`;
  };

  // Ambil notifikasi dari server action
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await getNotifications(15);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe ke event WebSocket/BroadcastChannel real-time
    const unsub = realtimeEmitter.subscribe('notification:new', (payload) => {
      setUnreadCount((prev) => prev + 1);
      if (payload) {
        const newItem: NotificationItem = {
          id: Date.now(),
          user_id: 0,
          type: payload.type || 'SYSTEM',
          title: payload.title || 'Notifikasi Baru',
          message: payload.message || '',
          read: false,
          action_url: payload.action_url || null,
          created_at: new Date().toISOString(),
        };
        setNotifications((prev) => [newItem, ...prev]);
      }
    });

    // Polling periodik ringan setiap 45 detik sebagai fallback
    const interval = setInterval(() => {
      getNotifications(15).then((res) => {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }).catch(() => {});
    }, 45000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Close dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format waktu relatif (misal: "5m lalu", "2j lalu")
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return locale === 'id' ? 'baru saja' : 'just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ${locale === 'id' ? 'lalu' : 'ago'}`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}j ${locale === 'id' ? 'lalu' : 'h ago'}`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay < 7) return `${diffDay}h ${locale === 'id' ? 'lalu' : 'd ago'}`;
      return date.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Render icon & background berdasarkan tipe notifikasi
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'REWARD_XP':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-4 h-4 fill-purple-600 text-purple-600" />
          </div>
        );
      case 'REWARD_LTP':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
            <Coins className="w-4 h-4 fill-amber-500 text-amber-600" />
          </div>
        );
      case 'COMMENT':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
        );
      case 'MEETUP_RSVP':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
        );
      case 'BOOKING':
        return (
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 shadow-xs">
            <Backpack className="w-4 h-4 text-orange-600" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 shadow-xs">
            <Info className="w-4 h-4 text-slate-600" />
          </div>
        );
    }
  };

  // Tandai 1 notifikasi dibaca dan navigasi ke actionUrl
  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markNotificationAsRead(notif.id);
    }

    if (notif.action_url) {
      setIsOpen(false);
      const targetUrl = getLocalizedActionUrl(notif.action_url);
      router.push(targetUrl);
    }
  };

  // Tandai semua dibaca
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Tombol Lonceng Navigasi */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        aria-label="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black tracking-tight text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel Notifikasi */}
      {isOpen && (
        <div className="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 -mr-12 sm:mr-0">
          {/* Header Panel */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 tracking-tight">
                {locale === 'id' ? 'Notifikasi' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-brand-100 text-brand-800 rounded-full">
                  {unreadCount} {locale === 'id' ? 'baru' : 'new'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 hover:bg-brand-50 px-2 py-1 rounded-lg transition disabled:opacity-50"
                  title={locale === 'id' ? 'Tandai semua dibaca' : 'Mark all as read'}
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{locale === 'id' ? 'Tandai dibaca' : 'Mark all read'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Daftar Notifikasi Bertumpuk Vertikal */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {isLoading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                <span className="text-xs font-medium">
                  {locale === 'id' ? 'Memuat notifikasi...' : 'Loading notifications...'}
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Bell className="w-6 h-6 opacity-60" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {locale === 'id' ? 'Belum Ada Notifikasi Baru' : 'No New Notifications'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                  {locale === 'id'
                    ? 'Aktivitas komunitas, perolehan XP, dan reward koin LTP Anda akan muncul di sini.'
                    : 'Community interactions, XP gains, and LTP rewards will appear here.'}
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.read;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`flex items-start gap-3 p-3.5 cursor-pointer transition select-none ${
                      isUnread
                        ? 'bg-purple-50/50 hover:bg-purple-50'
                        : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    {renderTypeIcon(notif.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h5
                          className={`text-xs ${
                            isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-800'
                          } truncate`}
                        >
                          {notif.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.action_url && (
                        <div className="mt-1.5">
                          <Link
                            href={getLocalizedActionUrl(notif.action_url)}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!notif.read) {
                                setNotifications((prev) =>
                                  prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                                );
                                setUnreadCount((prev) => Math.max(0, prev - 1));
                                await markNotificationAsRead(notif.id);
                              }
                              setIsOpen(false);
                            }}
                            className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <span>{currentLocale === 'id' ? 'Lihat detail' : 'View detail'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      )}
                    </div>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Panel */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href={`/${currentLocale}/dashboard`}
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-purple-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {currentLocale === 'id' ? 'Buka Dashboard Aktivitas' : 'Go to Activity Dashboard'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

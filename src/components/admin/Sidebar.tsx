'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ShieldCheck,
  Wallet,
  Megaphone,
  Compass,
  Sparkles,
  ArrowLeft,
  Flame,
  MessageSquare,
  BookOpen,
  Calendar,
  ChevronRight,
  Star,
  Coins,
  CreditCard,
  ArrowUpRight,
  Ticket,
  Building2,
  Flag,
  LogOut,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { logoutAction } from '@/actions/auth/logout';

interface SubNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface NavItem {
  id: string;
  name: string;
  category?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  subItems?: SubNavItem[];
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'users',
    name: 'User Management',
    href: '/users',
    icon: Users,
  },
  {
    id: 'bookings',
    name: 'Bookings Control',
    href: '/bookings',
    icon: CalendarCheck,
  },
  {
    id: 'community',
    name: 'Community Control',
    category: 'Platform Content',
    href: '/community/meetups',
    icon: Flame,
    subItems: [
      {
        name: 'Travel Meetups',
        href: '/community/meetups',
        icon: Calendar,
        description: 'Gatherings, capacity & attendees',
      },
      {
        name: 'Discussion Forums',
        href: '/community/forums',
        icon: MessageSquare,
        description: 'Threads, pin/locks & spam moderation',
      },
      {
        name: 'Stories & Journals',
        href: '/community/stories',
        icon: BookOpen,
        description: 'Member narratives & publishing',
      },
      {
        name: 'Content Reports',
        href: '/community/reports',
        icon: Flag,
        description: 'Moderation queue & user flags',
      },
    ],
  },
  {
    id: 'kyc',
    name: 'Host KYC Verification',
    href: '/kyc',
    icon: ShieldCheck,
    badge: 'KYC',
  },
  {
    id: 'experiences',
    name: 'Tour Experiences',
    category: 'Catalog & Inventory',
    href: '/experiences',
    icon: Compass,
    subItems: [
      {
        name: 'Experiences Catalog',
        href: '/experiences',
        icon: Compass,
        description: 'Listing status, drafts & featured',
      },
      {
        name: 'Reviews Moderation',
        href: '/experiences/reviews',
        icon: Star,
        description: 'Traveler feedback, ratings & spam purge',
      },
    ],
  },
  {
    id: 'finances',
    name: 'Ledger & Finance',
    category: 'Treasury & Payments',
    href: '/finances',
    icon: Wallet,
    subItems: [
      {
        name: 'Financial Ledger & GMV',
        href: '/finances',
        icon: CreditCard,
        description: 'Gross revenue, take-rate & ticket ledger',
      },
      {
        name: 'Host Withdrawals & Payouts',
        href: '/finances/withdrawals',
        icon: ArrowUpRight,
        description: 'Host payout queues, bank audit & settlement',
      },
    ],
  },
  {
    id: 'economy',
    name: 'LTP & XP Economy',
    href: '/economy',
    icon: Coins,
  },
  {
    id: 'marketing',
    name: 'Marketing & Campaigns',
    category: 'Marketing & Campaigns',
    href: '/marketing/vouchers',
    icon: Megaphone,
    subItems: [
      {
        name: 'Promo Vouchers',
        href: '/marketing/vouchers',
        icon: Ticket,
        description: 'Coupons, usage limits & discounts',
      },
      {
        name: 'B2B Partners',
        href: '/b2b',
        icon: Building2,
        description: 'Corporate accounts & agency commissions',
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [openFlyoutId, setOpenFlyoutId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const isAdminSubdomain = !pathname.startsWith('/admin');
  const resolveHref = (path: string) => (isAdminSubdomain ? path : `/admin${path}`);
  const normalizedPath = pathname.replace(/^\/admin/, '') || '/';

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutAction();
      const loginUrl = isAdminSubdomain ? '/login' : '/admin/login';
      await signOut({ callbackUrl: loginUrl, redirect: true });
    } catch (err) {
      console.error('Logout error:', err);
      const loginUrl = isAdminSubdomain ? '/login' : '/admin/login';
      window.location.href = loginUrl;
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close flyout when route changes
  useEffect(() => {
    setOpenFlyoutId(null);
  }, [pathname]);

  // Click outside to close flyout
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        setOpenFlyoutId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCurrentActive = (item: NavItem) => {
    if (item.id === 'overview') {
      return normalizedPath === '/' || normalizedPath === '/dashboard';
    }
    if (item.subItems) {
      return item.subItems.some((sub) => {
        if (sub.href === '/experiences') {
          return (
            normalizedPath === '/experiences' ||
            (normalizedPath.startsWith('/experiences/') && !normalizedPath.startsWith('/experiences/reviews'))
          );
        }
        if (sub.href === '/finances') {
          return (
            normalizedPath === '/finances' ||
            (normalizedPath.startsWith('/finances/') && !normalizedPath.startsWith('/finances/withdrawals'))
          );
        }
        return normalizedPath.startsWith(sub.href);
      });
    }
    return normalizedPath.startsWith(item.href);
  };

  return (
    <aside
      ref={flyoutRef}
      className="fixed left-4 top-4 bottom-4 w-[76px] z-50 flex flex-col items-center justify-between py-5 px-2.5 rounded-3xl bg-white/80 dark:bg-[#1A1D21]/80 backdrop-blur-2xl border border-gray-200/90 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/40 transition-colors duration-300"
    >
      {/* Top Section: Brand Logo Icon */}
      <div className="flex flex-col items-center gap-6">
        <Link href={resolveHref('/dashboard')} className="outline-none block">
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 cursor-pointer"
            title="Locallytrip Admin Console"
          >
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="sr-only">Locallytrip Admin</span>
          </motion.div>
        </Link>

        {/* Separator Divider */}
        <div className="w-8 h-px bg-gray-200 dark:bg-white/10" />

        {/* Navigation Interactive Icon List */}
        <nav className="flex flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isCurrentActive(item);
            const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
            const isFlyoutOpen = openFlyoutId === item.id;

            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {hasSubItems ? (
                  /* Expandable flyout button for Community Control */
                  <button
                    type="button"
                    onClick={() => setOpenFlyoutId(isFlyoutOpen ? null : item.id)}
                    className="outline-none block select-none"
                  >
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="relative w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer select-none"
                    >
                      {/* Sliding Active Pill Background */}
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarPill"
                          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/35 dark:shadow-purple-600/50"
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        />
                      )}

                      {/* Sliding Active Left Notch */}
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarNotch"
                          className="absolute -left-3.5 w-1.5 h-6 bg-purple-600 rounded-r-full shadow-sm"
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        />
                      )}

                      {/* Soft Hover Pill for Inactive items */}
                      {!isActive && hoveredItem === item.id && (
                        <motion.div
                          layoutId="hoverSidebarPill"
                          className="absolute inset-0 rounded-2xl bg-gray-100/90 dark:bg-white/10"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}

                      {/* Icon */}
                      <span
                        className={`relative z-10 transition-colors duration-200 ${
                          isActive
                            ? 'text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>

                      {/* Tiny indicator dot for multi-module sub-menu */}
                      <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-purple-400/80 z-20" />
                    </motion.div>
                  </button>
                ) : (
                  /* Standard Link item */
                  <Link href={resolveHref(item.href)} className="outline-none block">
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="relative w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer select-none"
                    >
                      {/* Sliding Active Pill Background */}
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarPill"
                          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/35 dark:shadow-purple-600/50"
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        />
                      )}

                      {/* Sliding Active Left Notch */}
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarNotch"
                          className="absolute -left-3.5 w-1.5 h-6 bg-purple-600 rounded-r-full shadow-sm"
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        />
                      )}

                      {/* Soft Hover Pill for Inactive items */}
                      {!isActive && hoveredItem === item.id && (
                        <motion.div
                          layoutId="hoverSidebarPill"
                          className="absolute inset-0 rounded-2xl bg-gray-100/90 dark:bg-white/10"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}

                      {/* Icon */}
                      <span
                        className={`relative z-10 transition-colors duration-200 ${
                          isActive
                            ? 'text-white'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>

                      {/* Small notification badge */}
                      {item.badge && !isActive && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-black border border-purple-200 dark:border-purple-800 z-20">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                )}

                {/* Sub-menu Flyout Popover for Community Control */}
                <AnimatePresence>
                  {hasSubItems && isFlyoutOpen && item.subItems && (
                    <motion.div
                      initial={{ opacity: 0, x: 10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 22, scale: 1 }}
                      exit={{ opacity: 0, x: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="absolute left-full top-1/2 -translate-y-1/2 z-50 w-72 p-3 rounded-3xl bg-white/95 dark:bg-[#1A1D21]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/10 shadow-2xl space-y-1.5"
                    >
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                            {item.category || 'Management'}
                          </span>
                          <h4 className="text-xs font-black text-gray-900 dark:text-white">
                            {item.name}
                          </h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold">
                          {item.subItems.length} Modules
                        </span>
                      </div>

                      <div className="space-y-1 pt-1">
                        {item.subItems.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = (() => {
                            if (sub.href === '/experiences') {
                              return (
                                normalizedPath === '/experiences' ||
                                (normalizedPath.startsWith('/experiences/') &&
                                  !normalizedPath.startsWith('/experiences/reviews'))
                              );
                            }
                            if (sub.href === '/finances') {
                              return (
                                normalizedPath === '/finances' ||
                                (normalizedPath.startsWith('/finances/') &&
                                  !normalizedPath.startsWith('/finances/withdrawals'))
                              );
                            }
                            return normalizedPath.startsWith(sub.href);
                          })();

                          return (
                            <Link
                              key={sub.href}
                              href={resolveHref(sub.href)}
                              onClick={() => setOpenFlyoutId(null)}
                              className={`p-2.5 rounded-2xl flex items-center gap-3 transition-colors ${
                                isSubActive
                                  ? 'bg-purple-600 text-white'
                                  : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isSubActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                                }`}
                              >
                                <SubIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs block truncate leading-tight">
                                  {sub.name}
                                </span>
                                <span
                                  className={`text-[10px] block truncate leading-tight mt-0.5 ${
                                    isSubActive ? 'text-purple-200' : 'text-gray-400'
                                  }`}
                                >
                                  {sub.description}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Floating Tooltip Pill (when flyout is not open) */}
                <AnimatePresence>
                  {hoveredItem === item.id && !isFlyoutOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: 10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 18, scale: 1 }}
                      exit={{ opacity: 0, x: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute left-full top-1/2 -translate-y-1/2 z-50 pointer-events-none whitespace-nowrap pl-2"
                    >
                      <div className="px-3 py-1.5 rounded-xl bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-950 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 dark:bg-purple-600 text-purple-200 dark:text-white">
                            {item.badge}
                          </span>
                        )}
                        {hasSubItems && (
                          <span className="text-[10px] text-purple-400 dark:text-purple-600 font-mono">
                            ({item.subItems?.length} Sub-modules)
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Public Portal & Logout Buttons */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-px bg-gray-200 dark:bg-white/10 my-0.5" />

        {/* Back to Public Portal */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredItem('public_portal')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <Link href="/id" className="outline-none block" title="Return to Public Site">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100/80 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.div>
          </Link>

          <AnimatePresence>
            {hoveredItem === 'public_portal' && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 18, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-full top-1/2 -translate-y-1/2 z-50 pointer-events-none whitespace-nowrap pl-2"
              >
                <div className="px-3 py-1.5 rounded-xl bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-950 text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Public Site</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Secure Logout Action */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredItem('logout_action')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="outline-none block cursor-pointer group"
            aria-label="Logout from Admin Console"
            title="Keluar (Logout)"
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin text-rose-600 dark:text-rose-400" />
              ) : (
                <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              )}
            </motion.div>
          </button>

          <AnimatePresence>
            {hoveredItem === 'logout_action' && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 18, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-full top-1/2 -translate-y-1/2 z-50 pointer-events-none whitespace-nowrap pl-2"
              >
                <div className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar (Logout)</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}

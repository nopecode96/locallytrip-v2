'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePreferences } from './PreferencesContext';
import { ChevronDown, Globe, Compass, Sparkles, MessageSquare, Users, BookOpen, Search, Menu, X, LayoutDashboard } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Locale, Currency } from '@/lib/i18n';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { UserAvatar } from '@/components/common/UserAvatar';

import { Dictionary } from '@/lib/dictionary';

interface HeaderProps {
  dict?: Dictionary;
}

export function Header({ dict }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { locale, currency, setLocale, setCurrency } = usePreferences();
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const communityRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (communityRef.current && !communityRef.current.contains(event.target as Node)) {
        setIsCommunityOpen(false);
      }
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const isId = locale === 'id';

  const tNav = dict?.nav || {
    explore: isId ? 'Eksplor' : 'Explore',
    experiences: isId ? 'Pengalaman' : 'Experiences',
    community: isId ? 'Komunitas' : 'Community',
    forums: isId ? 'Forum Diskusi' : 'Vibes Forum',
    meetups: isId ? 'Temu Komunitas' : 'Travel Meetups',
    stories: isId ? 'Cerita' : 'Stories',
  };

  const tCommon = dict?.common || {
    appName: 'Locallytrip',
    login: isId ? 'Masuk' : 'Sign In',
    register: isId ? 'Daftar' : 'Sign Up',
    becomeHost: isId ? 'Jadi Host' : 'Become a Host',
    search: isId
      ? 'Cari pengalaman lokal, kota, atau cerita...'
      : 'Search local experiences, cities, or stories...',
  };

  const currentLangPrefix = `/${locale}`;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo & Main Navigation */}
        <div className="flex items-center gap-8">
          <Link href={currentLangPrefix} className="flex items-center group py-1">
            <img
              src="/images/logo.webp"
              alt="Locallytrip"
              className="h-9 md:h-10 w-auto object-contain transition duration-200 group-hover:opacity-90"
              width={200}
              height={40}
            />
          </Link>

          {/* Nav Hierarchy: Explore | Experiences | Community (Dropdown Forums & Meetups) | Stories */}
          <nav className="hidden lg:flex items-center gap-1 font-medium text-gray-700 text-sm">
            <Link
              href={`${currentLangPrefix}/explore`}
              className="px-3.5 py-2 rounded-lg hover:text-brand-600 hover:bg-brand-50 transition flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-brand-600" />
              <span>{tNav.explore}</span>
            </Link>

            <Link
              href={`${currentLangPrefix}/experiences`}
              className="px-3.5 py-2 rounded-lg hover:text-brand-600 hover:bg-brand-50 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>{tNav.experiences}</span>
            </Link>

            {/* Community Dropdown (Forums & Meetups) */}
            <div className="relative" ref={communityRef}>
              <button
                type="button"
                onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                className={`px-3.5 py-2 rounded-lg hover:text-brand-600 hover:bg-brand-50 transition flex items-center gap-1.5 cursor-pointer ${
                  isCommunityOpen ? 'text-brand-600 bg-brand-50' : ''
                }`}
              >
                <Users className="w-4 h-4 text-brand-500" />
                <span>{tNav.community}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCommunityOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCommunityOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Vibes Community
                  </div>
                  <Link
                    href={`${currentLangPrefix}/community/forums`}
                    onClick={() => setIsCommunityOpen(false)}
                    className="flex items-start gap-3 px-3.5 py-2.5 hover:bg-brand-50 transition group"
                  >
                    <div className="p-2 rounded-lg bg-brand-100/60 text-brand-700 group-hover:bg-brand-600 group-hover:text-white transition">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-brand-700">
                        {tNav.forums}
                      </div>
                      <div className="text-xs text-gray-500">
                        Diskusi dan tanya jawab traveler
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={`${currentLangPrefix}/community/meetups`}
                    onClick={() => setIsCommunityOpen(false)}
                    className="flex items-start gap-3 px-3.5 py-2.5 hover:bg-brand-50 transition group"
                  >
                    <div className="p-2 rounded-lg bg-brand-100/60 text-brand-700 group-hover:bg-brand-600 group-hover:text-white transition">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-brand-700">
                        {tNav.meetups}
                      </div>
                      <div className="text-xs text-gray-500">
                        Agenda kumpul & jalan bareng
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href={`${currentLangPrefix}/stories`}
              className="px-3.5 py-2 rounded-lg hover:text-brand-600 hover:bg-brand-50 transition flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-brand-600" />
              <span>{tNav.stories}</span>
            </Link>
          </nav>
        </div>

        {/* Right Action: Language / Currency Switcher & Auth */}
        <div className="flex items-center gap-3">
          {/* Switcher Dropdown */}
          <div className="relative" ref={switcherRef}>
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50/80 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-brand-600" />
              <span>{locale.toUpperCase()}</span>
              <span className="text-gray-300">•</span>
              <span>{currency}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isSwitcherOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50">
                <div className="mb-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Bahasa / Language
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLocale('id');
                        setIsSwitcherOpen(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-left transition cursor-pointer ${
                        locale === 'id'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      🇮🇩 Bahasa (ID)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocale('en');
                        setIsSwitcherOpen(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-left transition cursor-pointer ${
                        locale === 'en'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      🇬🇧 English (EN)
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Mata Uang / Currency
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrency('IDR');
                        setIsSwitcherOpen(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-left transition cursor-pointer ${
                        currency === 'IDR'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      IDR (Rp)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrency('USD');
                        setIsSwitcherOpen(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-left transition cursor-pointer ${
                        currency === 'USD'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {session?.user && (
            <NotificationBell locale={locale} />
          )}

          {session?.user ? (
            <Link
              href={`${currentLangPrefix}/dashboard`}
              className="inline-flex items-center gap-2 text-xs font-bold pl-1.5 pr-3.5 sm:pr-4 py-1.5 text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 rounded-xl transition shadow-sm shadow-brand-500/25"
            >
              <UserAvatar
                src={(session.user as any).avatar_url || session.user.image}
                name={session.user.name}
                size={24}
                className="border-white/40 ring-1 ring-white/30"
              />
              <span>{locale === 'id' ? 'Dashboard' : 'Dashboard'}</span>
            </Link>
          ) : (
            <Link
              href={`${currentLangPrefix}/login`}
              className="inline-flex text-xs font-bold px-3.5 sm:px-4 py-2 text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 rounded-xl transition shadow-sm shadow-brand-500/25"
            >
              {tCommon.login}
            </Link>
          )}

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <Link
            href={`${currentLangPrefix}/explore`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition"
          >
            <Compass className="w-4 h-4 text-violet-600" />
            <span>{tNav.explore}</span>
          </Link>
          <Link
            href={`${currentLangPrefix}/experiences`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition"
          >
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>{tNav.experiences}</span>
          </Link>
          <Link
            href={`${currentLangPrefix}/community/meetups`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition"
          >
            <Users className="w-4 h-4 text-violet-600" />
            <span>{tNav.meetups}</span>
          </Link>
          <Link
            href={`${currentLangPrefix}/community/forums`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition"
          >
            <MessageSquare className="w-4 h-4 text-violet-600" />
            <span>{tNav.forums}</span>
          </Link>
          <Link
            href={`${currentLangPrefix}/stories`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition"
          >
            <BookOpen className="w-4 h-4 text-violet-600" />
            <span>{tNav.stories}</span>
          </Link>
          {session?.user && (
            <Link
              href={`${currentLangPrefix}/dashboard`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 transition"
            >
              <LayoutDashboard className="w-4 h-4 text-brand-600" />
              <span>Dashboard</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

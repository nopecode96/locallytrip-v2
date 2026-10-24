'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dictionary } from '@/lib/dictionary';
import { Mail, MapPin } from 'lucide-react';

interface FooterProps {
  dict?: Dictionary;
  locale?: string;
}

export function Footer({ dict, locale = 'id' }: FooterProps) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const pathLang = pathname?.startsWith('/en') ? 'en' : 'id';
  const currentLang = pathLang || locale || 'id';

  const t = dict?.footer || {
    about:
      'Platform marketplace kurasi pemandu lokal dan komunitas perjalanan terverifikasi di Indonesia.',
    companyLegalName: 'PT Locallytrip Teknologi Indonesia',
    marketplace: 'Marketplace',
    exploreExperiences: 'Jelajah Pengalaman',
    cityDestinations: 'Destinasi Kota',
    becomeHost: 'Daftar Jadi Host',
    community: 'Komunitas & Vibes',
    forums: 'Forum Diskusi',
    meetups: 'Temu Komunitas (Meetups)',
    stories: 'Cerita Perjalanan',
    support: 'Dukungan & Legal',
    aboutUs: 'Tentang Kami',
    contactUs: 'Hubungi Kami',
    helpCenter: 'Pusat Bantuan',
    privacy: 'Kebijakan Privasi',
    terms: 'Syarat & Ketentuan',
    copyright: 'PT Locallytrip Teknologi Indonesia. Hak Cipta Dilindungi.',
  };

  return (
    <footer className="bg-slate-950 text-slate-400 text-sm py-14 mt-20 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Kolom 1: Legalitas Perusahaan & Kontak */}
        <div className="space-y-3">
          <Link href={`/${currentLang}`} className="inline-block">
            <img
              src="/images/logo.webp"
              alt="Locallytrip"
              className="h-8 md:h-9 w-auto object-contain brightness-0 invert opacity-90"
              width={180}
              height={36}
            />
          </Link>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            {t.about}
          </p>

          <div className="pt-2 space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span>Jakarta, Indonesia</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <a
                href="mailto:support@locallytrip.com"
                className="hover:text-white transition"
              >
                support@locallytrip.com
              </a>
            </div>
          </div>

          {/* Social Media Links dengan URL Publik Aktif */}
          <div className="pt-2 flex items-center gap-3 text-slate-400">
            <a
              href="https://instagram.com/locallytrip"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Locallytrip Instagram"
              className="w-8 h-8 rounded-full bg-slate-900 hover:bg-violet-600 hover:text-white flex items-center justify-center transition"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://twitter.com/locallytrip"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Locallytrip Twitter"
              className="w-8 h-8 rounded-full bg-slate-900 hover:bg-violet-600 hover:text-white flex items-center justify-center transition"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://tiktok.com/locallytrip"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Locallytrip TikTok"
              className="w-8 h-8 rounded-full bg-slate-900 hover:bg-violet-600 hover:text-white flex items-center justify-center transition"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Kolom 2: Marketplace */}
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">{t.marketplace}</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                href={`/${currentLang}/explore`}
                className="hover:text-violet-400 transition"
              >
                {t.cityDestinations || (currentLang === 'id' ? 'Eksplorasi Kota & Destinasi' : 'Explore Cities & Destinations')}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/experiences`}
                className="hover:text-violet-400 transition"
              >
                {t.exploreExperiences}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/become-a-host`}
                className="hover:text-violet-400 transition"
              >
                {t.becomeHost}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/partner-with-us`}
                className="hover:text-violet-400 transition flex items-center gap-1.5"
              >
                <span>🤝</span>
                <span>{currentLang === 'id' ? 'Kerjasama Brand & Barter Promosi' : 'Brand Partnerships & Barter'}</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Kolom 3: Komunitas */}
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">{t.community}</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                href={`/${currentLang}/community`}
                className="hover:text-violet-400 transition font-medium"
              >
                {currentLang === 'id' ? 'Hub Komunitas' : 'Community Hub'}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/community/meetups`}
                className="hover:text-violet-400 transition"
              >
                {t.meetups}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/community/forums`}
                className="hover:text-violet-400 transition"
              >
                {t.forums}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/stories`}
                className="hover:text-violet-400 transition"
              >
                {t.stories}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/community/rewards`}
                className="hover:text-white text-slate-400 transition flex items-center gap-1.5"
              >
                <span>🪙</span>
                <span>{currentLang === 'id' ? 'Hadiah LTP & Level XP' : 'LTP Rewards & XP'}</span>
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/community/perks`}
                className="hover:text-white text-slate-400 transition flex items-center gap-1.5"
              >
                <span>🎁</span>
                <span>{currentLang === 'id' ? 'Katalog Hadiah Mitra (Perks)' : 'Brand Perks & Vouchers'}</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Kolom 4: Dukungan & Legalitas */}
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">{t.support}</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                href={`/${currentLang}/about`}
                className="hover:text-violet-400 transition"
              >
                {t.aboutUs || 'Tentang Kami'}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/contact`}
                className="hover:text-violet-400 transition"
              >
                {t.contactUs || 'Hubungi Kami'}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/help`}
                className="hover:text-violet-400 transition"
              >
                {t.helpCenter || 'Pusat Bantuan'}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/privacy`}
                className="hover:text-violet-400 transition"
              >
                {t.privacy}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/terms`}
                className="hover:text-violet-400 transition"
              >
                {t.terms}
              </Link>
            </li>
            <li>
              <Link
                href={`/${currentLang}/cookie-policy`}
                className="hover:text-violet-400 transition"
              >
                {currentLang === 'id' ? 'Kebijakan Cookie & Cache' : 'Cookie & Cache Policy'}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bagian Bawah: Hak Cipta & Legalitas Resmi Perusahaan */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-900 text-xs text-center text-slate-500">
        © 2026 PT Locallytrip Teknologi Indonesia. {dict?.common?.allRightsReserved || 'Hak Cipta Dilindungi.'}
      </div>
    </footer>
  );
}

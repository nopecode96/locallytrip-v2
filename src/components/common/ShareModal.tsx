'use client';

import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

export interface ShareData {
  title: string;
  summary?: string;
  coverImage?: string;
  categoryBadge?: string;
  slug?: string;
  pathType?: 'stories' | 'experiences' | 'meetups' | 'forums';
  url?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
  data: ShareData;
}

export function ShareModal({ isOpen, onClose, lang = 'id', data }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const isEn = lang === 'en';

  // 1. Standarisasi URL absolut publik (hindari localhost di media sosial)
  const productionDomain = process.env.NEXT_PUBLIC_SITE_URL || 'https://locallytrip.com';
  const pathSegment = data.pathType ? `/${data.pathType}` : '/stories';
  const fallbackUrl = `${productionDomain}/${lang}${pathSegment}/${data.slug || ''}`;

  let targetUrl = fallbackUrl;
  if (data.url) {
    if (data.url.startsWith('http')) {
      // Jika url berawalan localhost, ganti hostnya dengan productionDomain
      try {
        const parsed = new URL(data.url);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          targetUrl = `${productionDomain}${parsed.pathname}${parsed.search}`;
        } else {
          targetUrl = data.url;
        }
      } catch {
        targetUrl = data.url;
      }
    } else {
      targetUrl = `${productionDomain}${data.url.startsWith('/') ? data.url : `/${data.url}`}`;
    }
  }

  const shareTitle = data.title || (isEn ? 'Locallytrip Travel Story' : 'Cerita Perjalanan Locallytrip');

  // Payload format teks pengantar otomatis draf
  const postPayload = isEn
    ? `"${shareTitle}" - Authentic travel notes on Locallytrip:\n${
        data.summary ? data.summary.slice(0, 120) + '...\n\n' : '\n'
      }${targetUrl}`
    : `"${shareTitle}" - Catatan perjalanan otentik di Locallytrip:\n${
        data.summary ? data.summary.slice(0, 120) + '...\n\n' : '\n'
      }${targetUrl}`;

  // Dictionary i18n
  const t = isEn
    ? {
        title: 'Share the Vibe ✨',
        subtitle: 'Spread the story love with your crew! 📖',
        guide: 'Choose your platform bestie! 👇',
        copyLink: 'Copy Link 🔗',
        copyNote: 'Share anywhere you want!',
        copiedToast: 'Link copied to clipboard! ✨',
        footer: '✨ Thanks for spreading the Locallytrip love! ✨',
        defaultSummary: 'Discover authentic spots and hidden corners on Locallytrip.',
      }
    : {
        title: 'Bagikan Cerita ✨',
        subtitle: 'Sebarkan inspirasi perjalanan ini ke teman-temanmu! 📖',
        guide: 'Pilih platform media sosial favoritmu! 👇',
        copyLink: 'Salin Tautan 🔗',
        copyNote: 'Bagikan ke mana saja sesuai keinginanmu!',
        copiedToast: 'Tautan berhasil disalin ke clipboard! ✨',
        footer: '✨ Terima kasih telah menyebarkan semangat Locallytrip! ✨',
        defaultSummary: 'Temukan sudut otentik & cerita tersembunyi di Locallytrip.',
      };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = targetUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy link:', e);
    }
  };

  const handleInstagramShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: data.summary || shareTitle,
          url: targetUrl,
        });
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      await handleCopyLink();
    }
  };

  const coverSrc = data.coverImage
    ? data.coverImage.startsWith('http') || data.coverImage.startsWith('/')
      ? data.coverImage
      : `/images/stories/${data.coverImage}`
    : '/images/default.jpg';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 sm:p-7">
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal share"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="mb-4">
          <h3
            id="share-modal-title"
            className="text-xl font-bold text-purple-950 flex items-center gap-1.5"
          >
            {t.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.subtitle}</p>
        </div>

        {/* Kartu Pratinjau Mini */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex gap-3 items-center mb-5">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-200">
            <img
              src={coverSrc}
              alt={shareTitle}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/default.jpg';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{shareTitle}</h4>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
              {data.summary || t.defaultSummary}
            </p>
            {data.categoryBadge && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-semibold rounded-md">
                {data.categoryBadge}
              </span>
            )}
          </div>
        </div>

        <p className="text-center text-xs font-medium text-slate-600 mb-3">{t.guide}</p>

        {/* Grid Platform Sosial (6 Platform Ikonik: Insta, X, WhatsApp, Facebook, Threads, LinkedIn) */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* 1. Insta Story */}
          <button
            type="button"
            onClick={handleInstagramShare}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white font-medium text-[11px] shadow-sm hover:opacity-95 transition-all active:scale-95 cursor-pointer"
          >
            <span className="text-lg mb-1">📸</span>
            <span>Insta Story</span>
          </button>

          {/* 2. X (Twitter) */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(targetUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-black text-white font-medium text-[11px] shadow-sm hover:bg-neutral-800 transition-all active:scale-95 text-center cursor-pointer"
          >
            <span className="text-lg mb-1">𝕏</span>
            <span>X Tweet</span>
          </a>

          {/* 3. WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(postPayload)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500 text-white font-medium text-[11px] shadow-sm hover:bg-emerald-600 transition-all active:scale-95 text-center cursor-pointer"
          >
            <span className="text-lg mb-1">💬</span>
            <span>WhatsApp</span>
          </a>

          {/* 4. Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-600 text-white font-medium text-[11px] shadow-sm hover:bg-blue-700 transition-all active:scale-95 text-center cursor-pointer"
          >
            <span className="text-lg mb-1">📘</span>
            <span>Facebook</span>
          </a>

          {/* 5. Threads (Gantikan Telegram) */}
          <a
            href={`https://threads.net/intent/post?text=${encodeURIComponent(postPayload)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-900 text-white font-medium text-[11px] shadow-sm hover:bg-black transition-all active:scale-95 text-center cursor-pointer"
          >
            <svg className="w-5 h-5 mb-1 fill-current" viewBox="0 0 24 24">
              <path d="M12.186 24C5.464 24 0 18.536 0 11.814 0 5.093 5.464-.372 12.186-.372c6.643 0 12.106 5.394 12.106 12.107 0 .61-.044 1.23-.133 1.839-.148.972-.942 1.639-1.923 1.639-.982 0-1.787-.667-1.935-1.639a8.683 8.683 0 0 0 .105-1.839c0-4.664-3.793-8.457-8.457-8.457-4.665 0-8.458 3.793-8.458 8.457 0 4.665 3.793 8.458 8.458 8.458 2.656 0 5.034-1.22 6.574-3.176l.105-.133c.664-.842 1.884-.996 2.727-.332.842.664.996 1.884.332 2.727l-.105.133C19.123 22.023 15.808 24 12.186 24Zm4.512-10.738c-.14-3.56-2.228-5.748-5.362-5.748-3.473 0-5.74 2.508-5.74 5.922 0 3.334 2.158 5.8 5.565 5.8 1.96 0 3.666-.884 4.654-2.414.542-.843 1.666-1.077 2.51-.535.843.542 1.077 1.666.535 2.51-1.636 2.544-4.437 3.99-7.699 3.99-5.46 0-9.115-3.92-9.115-9.35 0-5.513 3.77-9.473 9.29-9.473 5.074 0 8.784 3.518 8.985 8.636.035.843-.61 1.562-1.453 1.597l-.17.003c-.808 0-1.482-.647-1.5-1.438Z" />
            </svg>
            <span>Threads</span>
          </a>

          {/* 6. LinkedIn */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-700 text-white font-medium text-[11px] shadow-sm hover:bg-blue-800 transition-all active:scale-95 text-center cursor-pointer"
          >
            <span className="text-lg mb-1">💼</span>
            <span>LinkedIn</span>
          </a>
        </div>

        {/* Dashed Copy Link Bar */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2.5 p-3 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/40 hover:bg-violet-50 text-violet-900 transition-all active:scale-98 cursor-pointer"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Copy className="w-4 h-4 text-violet-600 shrink-0" />
          )}
          <div className="text-left">
            <p className="text-xs font-bold leading-tight">
              {copied ? t.copiedToast : t.copyLink}
            </p>
            <p className="text-[10px] text-slate-500">{t.copyNote}</p>
          </div>
        </button>

        {/* Footer Gamifikasi / Reward note */}
        <div className="mt-4 text-center py-2 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-[11px] font-medium text-purple-700">
            {t.footer}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook bantuan untuk mengontrol state modal share dengan mudah
 */
export function useShareModal() {
  const [isOpen, setIsOpen] = useState(false);
  const openShare = () => setIsOpen(true);
  const closeShare = () => setIsOpen(false);
  return { isOpen, openShare, closeShare };
}

interface ShareButtonProps {
  data: ShareData;
  lang?: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  title?: string;
}

/**
 * Komponen Client Button mandiri yang siap diletakkan di halaman Server Component apa pun
 */
export function ShareButton({
  data,
  lang = 'id',
  label,
  className,
  children,
  title,
}: ShareButtonProps) {
  const [isShareOpen, setShareOpen] = useState(false);
  const isEn = lang === 'en';

  const defaultLabel = isEn ? 'Share the Vibe ✨' : 'Bagikan Cerita Ini ✨';
  const displayLabel = label || defaultLabel;

  const defaultClassName =
    'inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium text-sm shadow-md shadow-violet-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer';

  return (
    <>
      <button
        type="button"
        onClick={() => setShareOpen(true)}
        className={className || defaultClassName}
        title={title || displayLabel}
      >
        {children || (
          <>
            <span>✨</span>
            <span>{displayLabel}</span>
          </>
        )}
      </button>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setShareOpen(false)}
        lang={lang}
        data={data}
      />
    </>
  );
}

export default ShareModal;

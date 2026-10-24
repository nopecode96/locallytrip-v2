'use client';

import React, { useState } from 'react';
import { Share2, Link as LinkIcon, Check, Sparkles } from 'lucide-react';
import { ShareModal } from '@/components/common/ShareModal';

interface SocialShareBarProps {
  url: string;
  title: string;
  summary?: string;
  coverImage?: string;
  categoryBadge?: string;
  shareTitleText?: string;
  copyLinkText?: string;
  linkCopiedText?: string;
}

export function SocialShareBar({
  url,
  title,
  summary = '',
  coverImage,
  categoryBadge,
  shareTitleText = 'Bagikan Cerita Ini',
  copyLinkText = 'Salin Tautan',
  linkCopiedText = 'Tautan berhasil disalin!',
}: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${title}\n${summary ? summary + '\n' : ''}${url}`);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const shareButtons = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.974.542 1.867.818 2.796.818 3.18 0 5.766-2.587 5.767-5.767 0-3.18-2.586-5.765-5.767-5.765zm3.376 8.212c-.144.405-.837.774-1.17.824-.312.046-.723.08-2.31-.577-1.745-.722-2.884-2.482-2.971-2.597-.087-.116-.707-.94-.707-1.794 0-.853.449-1.272.608-1.446.16-.174.348-.217.464-.217.116 0 .232.001.333.006.107.005.25-.041.391.298.145.348.493 1.202.536 1.29.043.087.072.189.014.305-.058.115-.087.188-.174.289-.087.102-.183.228-.261.306-.088.087-.18.182-.077.359.102.176.452.746.97 1.208.669.596 1.233.78 1.408.867.174.087.276.073.377-.044.101-.116.435-.508.551-.682.116-.174.232-.145.391-.087s1.015.478 1.189.565c.174.087.29.13.333.203.044.072.044.42-.1 1.025zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.307A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.058c-1.637 0-3.15-.502-4.405-1.365l-.316-.216-2.96.776.79-2.884-.236-.376C4.444 15.19 3.942 13.637 3.942 12c0-4.443 3.615-8.058 8.058-8.058 4.443 0 8.058 3.615 8.058 8.058 0 4.443-3.615 8.058-8.058 8.058z" />
        </svg>
      ),
      href: `https://api.whatsapp.com/send?text=${encodedText}`,
      className: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white',
    },
    {
      name: 'Twitter / X',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: 'bg-slate-100 text-slate-800 hover:bg-black hover:text-white',
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white',
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      className: 'bg-sky-50 text-sky-700 hover:bg-sky-700 hover:text-white',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-slate-100">
      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <Share2 className="w-3.5 h-3.5 text-violet-600" />
        <span>{shareTitleText}</span>
      </span>

      <div className="flex items-center gap-2">
        {shareButtons.map((btn) => (
          <a
            key={btn.name}
            href={btn.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share to ${btn.name}`}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${btn.className}`}
          >
            {btn.icon}
          </a>
        ))}

        {/* Tombol Share the Vibe ✨ (Buka Modal Global) */}
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
          <span>Share the Vibe ✨</span>
        </button>

        {/* Copy Link Button */}
        <button
          type="button"
          onClick={handleCopy}
          title={copyLinkText}
          className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
            copied
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 hover:bg-violet-50 text-slate-700 hover:text-violet-700'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{linkCopiedText}</span>
            </>
          ) : (
            <>
              <LinkIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copyLinkText}</span>
            </>
          )}
        </button>
      </div>

      {/* Global ShareModal Component */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={{
          title,
          summary,
          coverImage,
          categoryBadge: categoryBadge || '📖 Travel Story',
          url,
        }}
      />
    </div>
  );
}

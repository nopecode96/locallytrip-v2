'use client';

import React, { useState } from 'react';
import { translateUgcText } from '@/actions/translate';
import { usePreferences } from '@/components/layout/PreferencesContext';
import { Globe, Loader2, Check } from 'lucide-react';

interface UgcTranslateButtonProps {
  originalText: string;
  className?: string;
}

export function UgcTranslateButton({ originalText, className = '' }: UgcTranslateButtonProps) {
  const { locale } = usePreferences();
  const [translated, setTranslated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslatedView, setIsTranslatedView] = useState(false);

  const handleTranslate = async () => {
    if (isTranslatedView) {
      // Toggle kembali ke teks asli
      setIsTranslatedView(false);
      return;
    }

    if (translated) {
      setIsTranslatedView(true);
      return;
    }

    setIsLoading(true);
    const res = await translateUgcText(originalText, locale);
    setIsLoading(false);

    if (res.success && res.translatedText) {
      setTranslated(res.translatedText);
      setIsTranslatedView(true);
    } else {
      alert(res.error || 'Gagal menerjemahkan.');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {isTranslatedView && translated && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-950 leading-relaxed animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <Check className="w-3 h-3" />
            <span>Terjemahan AI ({locale.toUpperCase()})</span>
          </div>
          <p className="whitespace-pre-line">{translated}</p>
        </div>
      )}

      <button
        type="button"
        disabled={isLoading}
        onClick={handleTranslate}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
        ) : (
          <Globe className="w-3 h-3 text-emerald-600" />
        )}
        <span>
          {isLoading
            ? 'Menerjemahkan...'
            : isTranslatedView
            ? 'Tampilkan Teks Asli'
            : '🌐 Lihat Terjemahan (Translate)'}
        </span>
      </button>
    </div>
  );
}

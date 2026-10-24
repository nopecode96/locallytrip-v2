'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Globe } from 'lucide-react';

interface LocalizedDescriptionProps {
  descriptionId?: string | null;
  descriptionEn?: string | null;
  defaultDescription: string;
  lang: string;
}

export function LocalizedDescription({
  descriptionId,
  descriptionEn,
  defaultDescription,
  lang,
}: LocalizedDescriptionProps) {
  // Teks bahasa Indonesia: gunakan descriptionId jika ada, fallback ke defaultDescription
  const textId = descriptionId || defaultDescription;
  // Teks bahasa Inggris: gunakan descriptionEn jika ada, fallback ke defaultDescription
  const textEn = descriptionEn || defaultDescription;

  // State tampilan saat ini: default sesuai parameter rute 'lang'
  const [currentLang, setCurrentLang] = useState<'id' | 'en'>(lang === 'en' ? 'en' : 'id');

  const hasBothLanguages = Boolean(descriptionId && descriptionEn && descriptionId !== descriptionEn);
  const activeText = currentLang === 'en' ? textEn : textId;

  const toggleLanguage = () => {
    setCurrentLang((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  return (
    <div className="space-y-4">
      {hasBothLanguages && (
        <div className="flex justify-end pb-2 border-b border-slate-100">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50/80 hover:bg-violet-100 text-violet-700 text-xs font-semibold transition cursor-pointer shadow-xs active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-violet-600" />
            <span>
              {currentLang === 'id'
                ? 'Tampilkan Bahasa Inggris'
                : 'Tampilkan Bahasa Indonesia'}
            </span>
          </button>
        </div>
      )}

      <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeText}</ReactMarkdown>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Globe, Loader2, Sparkles, RotateCcw } from 'lucide-react';

interface StoryContentReaderProps {
  originalContent: string;
  targetLang: string; // 'id' | 'en'
}

export function StoryContentReader({ originalContent, targetLang }: StoryContentReaderProps) {
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleTranslate = async () => {
    setError(null);

    // Toggle back to original text
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    // Already cached translation
    if (translatedText) {
      setIsTranslated(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: originalContent,
          targetLang: targetLang === 'en' ? 'en' : 'id',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.translatedText) {
        throw new Error(data.error || 'Gagal menerjemahkan konten');
      }

      setTranslatedText(data.translatedText);
      setIsTranslated(true);
    } catch (err) {
      console.error('Translation failed', err);
      setError(err instanceof Error ? err.message : 'Gagal menerjemahkan');
    } finally {
      setIsLoading(false);
    }
  };

  const displayText = isTranslated && translatedText ? translatedText : originalContent;

  return (
    <div className="w-full">
      {/* Tombol Aksi In-Place Translation di Atas Artikel */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          {isTranslated ? (
            <span className="inline-flex items-center gap-1 text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full font-semibold border border-violet-200/60">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>
                {targetLang === 'id' ? 'Terjemahan Bahasa Indonesia' : 'English Translation'}
              </span>
            </span>
          ) : (
            <span className="text-slate-500">
              {targetLang === 'id'
                ? 'Membaca dalam bahasa asli artikel'
                : 'Reading in original article language'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleToggleTranslate}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer ${
            isTranslated
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              : 'bg-violet-50/80 hover:bg-violet-100 text-violet-800 border border-violet-200 hover:scale-[1.02] active:scale-[0.98]'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isTranslated ? 'Kembali ke teks asli' : 'Terjemahkan artikel ini'}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
              <span>{targetLang === 'id' ? 'Menerjemahkan...' : 'Translating...'}</span>
            </>
          ) : isTranslated ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{targetLang === 'id' ? 'Tampilkan Teks Asli' : 'Show Original'}</span>
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5 text-violet-600" />
              <span>
                {targetLang === 'id'
                  ? '🌐 Terjemahkan ke Bahasa Indonesia'
                  : '🌐 Translate to English'}
              </span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
          {error}
        </div>
      )}

      {/* Render Markdown In-Place dengan Komponen Heading & Format Proporsional */}
      <div className="w-full max-w-none text-slate-800">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, ...props }) => (
              <h2
                className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mt-8 mb-3 tracking-tight border-b border-slate-100 pb-2"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mt-8 mb-3 tracking-tight border-b border-slate-100 pb-2"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="text-base sm:text-lg font-semibold text-violet-950 mt-5 mb-2"
                {...props}
              />
            ),
            p: ({ node, ...props }) => (
              <p
                className="text-sm sm:text-base text-slate-700 leading-relaxed mb-5 font-normal"
                {...props}
              />
            ),
            strong: ({ node, ...props }) => (
              <strong className="font-semibold text-slate-900" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-violet-500 bg-violet-50/50 p-4 rounded-r-xl italic text-slate-700 my-5 text-sm sm:text-base"
                {...props}
              />
            ),
            ul: ({ node, ...props }) => (
              <ul
                className="list-disc list-inside space-y-1.5 mb-5 text-sm sm:text-base text-slate-700 ml-2"
                {...props}
              />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="list-decimal list-inside space-y-1.5 mb-5 text-sm sm:text-base text-slate-700 ml-2"
                {...props}
              />
            ),
          }}
        >
          {displayText}
        </ReactMarkdown>
      </div>
    </div>
  );
}

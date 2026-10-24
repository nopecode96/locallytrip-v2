'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useContentTranslation } from '@/hooks/useContentTranslation';
import { Globe, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';

interface TranslatableContentProps {
  content: string;
  targetLang: string;
  isMarkdown?: boolean;
  className?: string;
  buttonPosition?: 'top' | 'inline' | 'bottom';
  showStatusBadge?: boolean;
}

export default function TranslatableContent({
  content,
  targetLang,
  isMarkdown = true,
  className = '',
  buttonPosition = 'top',
  showStatusBadge = true,
}: TranslatableContentProps) {
  const { isTranslated, currentText, isLoading, error, toggleTranslation } = useContentTranslation(
    content,
    targetLang,
    isMarkdown
  );

  const buttonLabel = isLoading
    ? (targetLang === 'id' ? 'Menerjemahkan...' : 'Translating...')
    : isTranslated
    ? (targetLang === 'id' ? 'Tampilkan Teks Asli' : 'Show Original')
    : (targetLang === 'id' ? 'Terjemahkan ke Bahasa Indonesia' : 'Translate to English');

  const ActionButton = (
    <button
      type="button"
      onClick={toggleTranslation}
      disabled={isLoading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
        isTranslated
          ? 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
          : 'border-violet-200 bg-violet-50/80 hover:bg-violet-100 text-violet-700 shadow-xs'
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
      ) : isTranslated ? (
        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
      ) : (
        <Globe className="w-3.5 h-3.5 text-violet-600" />
      )}
      <span>{buttonLabel}</span>
    </button>
  );

  return (
    <div className={`w-full ${className}`}>
      {buttonPosition === 'top' && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          {showStatusBadge ? (
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
          ) : <div />}
          <div>{ActionButton}</div>
        </div>
      )}

      {error && (
        <div className="mb-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
          {error}
        </div>
      )}

      {(() => {
        // Deteksi apakah konten adalah HTML dari Rich Text Editor
        const isHtmlContent = /<[a-z][\s\S]*>/i.test(currentText);

        if (isHtmlContent) {
          return (
            <div
              className="rich-text-body text-slate-800 leading-relaxed max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentText) }}
            />
          );
        }

        if (isMarkdown) {
          return (
            <div className="w-full max-w-none text-slate-800">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => (
                    <h2
                      className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-10 mb-4 tracking-tight border-b border-slate-100 pb-3"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mt-9 mb-3.5 tracking-tight border-b border-slate-100 pb-2.5"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-lg sm:text-xl font-serif font-semibold text-purple-950 mt-6 mb-2.5"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p
                      className="text-base sm:text-lg text-slate-700 leading-8 mb-6 font-normal"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-slate-900" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-purple-600 bg-purple-50/50 p-4 sm:p-5 rounded-r-2xl italic text-slate-700 my-6 text-base sm:text-lg leading-relaxed shadow-2xs"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="list-disc list-inside space-y-2 mb-6 text-base sm:text-lg text-slate-700 ml-2 leading-relaxed"
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className="list-decimal list-inside space-y-2 mb-6 text-base sm:text-lg text-slate-700 ml-2 leading-relaxed"
                      {...props}
                    />
                  ),
                  img: ({ node, ...props }) => (
                    <img
                      className="rounded-2xl max-w-full h-auto my-6 shadow-md border border-slate-200/80 mx-auto block object-cover"
                      {...props}
                    />
                  ),
                }}
              >
                {currentText}
              </ReactMarkdown>
            </div>
          );
        }

        return (
          <p className="text-body whitespace-pre-line text-sm sm:text-base text-slate-700 leading-relaxed">
            {currentText}
          </p>
        );
      })()}

      {buttonPosition === 'bottom' && (
        <div className="mt-3 flex items-center justify-start">{ActionButton}</div>
      )}
    </div>
  );
}

export { TranslatableContent };

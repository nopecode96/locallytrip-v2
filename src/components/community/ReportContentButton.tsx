'use client';

import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import ReportContentModal from './ReportContentModal';

export interface ReportContentButtonProps {
  targetType: 'forum_thread' | 'forum_post' | 'story' | 'meetup';
  targetId: number;
  targetTitle?: string;
  lang?: string;
  variant?: 'pill' | 'subtle' | 'icon' | 'minimal';
  className?: string;
  onSuccess?: () => void;
}

export function ReportContentButton({
  targetType,
  targetId,
  targetTitle,
  lang = 'id',
  variant = 'subtle',
  className = '',
  onSuccess,
}: ReportContentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEn = lang === 'en';

  let baseButtonClass = '';
  switch (variant) {
    case 'pill':
      baseButtonClass =
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 dark:bg-stone-800 dark:hover:bg-rose-950/40 dark:text-stone-300 dark:hover:text-rose-300 text-xs font-semibold border border-stone-200 dark:border-stone-700 hover:border-rose-300 dark:hover:border-rose-800 transition shadow-xs cursor-pointer active:scale-95';
      break;
    case 'icon':
      baseButtonClass =
        'p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition cursor-pointer';
      break;
    case 'minimal':
      baseButtonClass =
        'inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 hover:text-rose-600 transition cursor-pointer hover:underline';
      break;
    case 'subtle':
    default:
      baseButtonClass =
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-500 hover:text-rose-600 hover:bg-rose-50/70 dark:text-stone-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition cursor-pointer';
      break;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${baseButtonClass} ${className}`}
        title={isEn ? 'Report to moderator' : 'Laporkan ke moderator'}
      >
        <Flag className="w-3.5 h-3.5 shrink-0" />
        {variant !== 'icon' && (
          <span>{isEn ? 'Report' : 'Laporkan'}</span>
        )}
      </button>

      <ReportContentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetTitle={targetTitle}
        onSuccess={onSuccess}
      />
    </>
  );
}

export default ReportContentButton;

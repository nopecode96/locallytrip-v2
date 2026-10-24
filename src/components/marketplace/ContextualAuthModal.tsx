'use client';

import React from 'react';
import { X } from 'lucide-react';
import { UnifiedAuthCard } from '@/components/auth/UnifiedAuthCard';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { name: string; email: string }) => void;
  onQuickLogin?: () => Promise<void>;
  isLoading?: boolean;
  promptMessage?: string;
  locale?: string;
}

export function ContextualAuthModal({
  isOpen,
  onClose,
  onSuccess,
  promptMessage,
  locale = 'id',
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <UnifiedAuthCard
          locale={locale}
          isModal={true}
          promptMessage={promptMessage}
          onSuccess={() => {
            if (onSuccess) {
              onSuccess({ name: 'User', email: '' });
            }
            onClose();
          }}
        />
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { BecomeHostLanding } from './BecomeHostLanding';
import {
  BecomeHostWizard,
  CityOption,
  HostCategoryOption,
  LanguageOption,
} from './BecomeHostWizard';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { ContextualAuthModal } from '@/components/marketplace/ContextualAuthModal';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface BecomeHostClientProps {
  cities: CityOption[];
  hostCategories?: HostCategoryOption[];
  languages?: LanguageOption[];
  locale: string;
  initialShowWizard?: boolean;
}

export function BecomeHostClient({
  cities,
  hostCategories = [],
  languages = [],
  locale,
  initialShowWizard = false,
}: BecomeHostClientProps) {
  const [showWizard, setShowWizard] = useState<boolean>(initialShowWizard);
  const isId = locale === 'id';

  const {
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    executeProtected,
    authMessage,
  } = useProtectedAction();

  const handleStartWizard = () => {
    executeProtected(() => {
      setShowWizard(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, isId
      ? 'Silakan masuk atau daftar terlebih dahulu untuk mengisi formulir pendaftaran Local Host.'
      : 'Please sign in or register to complete the Local Host application form.');
  };

  const handleBackToLanding = () => {
    setShowWizard(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {showWizard ? (
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {/* Top navigation row spanning full width of header container */}
          <div className="w-full flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToLanding}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isId ? 'Kembali ke Panduan Keuntungan' : 'Back to Benefits Overview'}</span>
            </button>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isId ? 'Bonus +100 XP Saat Terdaftar' : '+100 XP On Registration'}</span>
            </div>
          </div>

          {/* Full-width clean wizard component */}
          <BecomeHostWizard
            cities={cities}
            hostCategories={hostCategories}
            languages={languages}
            locale={locale}
          />
        </div>
      ) : (
        <BecomeHostLanding locale={locale} onStartWizard={handleStartWizard} />
      )}

      {/* Auth guard modal */}
      <ContextualAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        promptMessage={authMessage}
        locale={locale}
        onSuccess={() => {
          setShowWizard(true);
        }}
      />
    </div>
  );
}

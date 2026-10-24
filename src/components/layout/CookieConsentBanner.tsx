"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Cookie } from 'lucide-react';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.lang as string) || 'id';

  useEffect(() => {
    // Cek apakah user sudah memberikan izin sebelumnya di localStorage
    const consent = localStorage.getItem('locallytrip_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('locallytrip_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible || pathname?.startsWith('/admin')) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 shadow-[0_-4px_16px_-1px_rgba(0,0,0,0.08)] p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 text-xs sm:text-sm text-slate-600 flex-1 leading-relaxed">
          <Cookie className="w-5 h-5 text-purple-600 shrink-0 mt-0.5 hidden sm:block" />
          <p>
            {locale === 'id' 
              ? 'Kami menggunakan cookie dan penyimpanan lokal (cache) untuk mengamankan sesi Anda, mengingat preferensi bahasa, dan memberikan pengalaman terbaik di platform kami.' 
              : 'We use cookies and local storage (cache) to secure your session, remember language preferences, and provide the best experience on our platform.'}
            {' '}
            <Link 
              className="text-purple-600 hover:text-purple-700 font-bold underline underline-offset-2 transition-colors inline-block" 
              href={`/${locale}/cookie-policy`}
            >
              {locale === 'id' ? 'Pelajari lebih lanjut' : 'Learn more'}
            </Link>.
          </p>
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
          <button 
            type="button"
            onClick={handleAccept}
            className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            {locale === 'id' ? 'Terima & Lanjutkan' : 'Accept & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

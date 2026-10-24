'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
      className={`fixed bottom-6 right-6 z-40 p-3 rounded-full bg-violet-600/90 text-white shadow-lg shadow-violet-500/30 backdrop-blur-sm transition-all duration-300 hover:bg-violet-700 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <ChevronUp className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
}

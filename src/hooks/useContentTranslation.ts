'use client';

import { useState } from 'react';
import { translateContent } from '@/lib/translateService';

export function useContentTranslation(
  originalText: string,
  targetLang: string,
  isMarkdown: boolean = false
) {
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTranslation = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedText) {
      setIsTranslated(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await translateContent(originalText, targetLang, isMarkdown);
      setTranslatedText(result);
      setIsTranslated(true);
    } catch (err: any) {
      setError(err?.message || 'Error translating');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isTranslated,
    currentText: isTranslated && translatedText ? translatedText : originalText,
    isLoading,
    error,
    toggleTranslation,
  };
}

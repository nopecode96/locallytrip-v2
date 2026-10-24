'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, Currency } from '@/lib/i18n';
import { formatPrice as formatPriceHelper } from '@/lib/currency';

interface PreferencesContextType {
  locale: Locale;
  currency: Currency;
  setLocale: (loc: Locale) => void;
  setCurrency: (cur: Currency) => void;
  exchangeRate: number; // USD to IDR rate
  formatPrice: (amount: number | null | undefined, baseCurrency?: string) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({
  children,
  initialLocale = 'id',
  initialCurrency = 'IDR',
  usdToIdrRate = 17896.90,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialCurrency?: Currency;
  usdToIdrRate?: number;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);

  // Sync dengan cookie browser saat pertama kali mount
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const savedLocale = getCookie('locallytrip_locale') as Locale;
    const savedCurrency = getCookie('locallytrip_currency') as Currency;

    if (savedLocale && (savedLocale === 'id' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
    }
    if (savedCurrency && (savedCurrency === 'IDR' || savedCurrency === 'USD')) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `locallytrip_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    // Update path jika berada di /[lang]...
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/id') || currentPath.startsWith('/en')) {
      const rest = currentPath.substring(3);
      window.location.href = `/${newLocale}${rest || ''}`;
    }
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    document.cookie = `locallytrip_currency=${newCurrency}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const formatPrice = (
    amount: number | null | undefined,
    baseCurrency: string = 'USD'
  ): string => {
    return formatPriceHelper(amount, baseCurrency, currency, usdToIdrRate);
  };

  return (
    <PreferencesContext.Provider
      value={{
        locale,
        currency,
        setLocale,
        setCurrency,
        exchangeRate: usdToIdrRate,
        formatPrice,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

import React from 'react';
import './globals.css';
import { PreferencesProvider } from '@/components/layout/PreferencesContext';
import { cookies } from 'next/headers';
import { Locale, Currency } from '@/lib/i18n';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import { SessionProvider } from '@/components/common/SessionProvider';
import GoogleAnalytics from '@/components/common/GoogleAnalytics';

export const metadata: Metadata = {
  title: "Locallytrip — Explore & Experience Like a Local",
  description: "Discover authentic local experiences, verified hosts, and community travel stories.",
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const savedLocale = (cookieStore.get('locallytrip_locale')?.value as Locale) || 'id';
  const savedCurrency = (cookieStore.get('locallytrip_currency')?.value as Currency) || 'IDR';

  // Mengambil exchange rate USD ke IDR dari database jika ada
  let usdToIdrRate = 17896.90;
  try {
    const rateRecord = await prisma.currency_rates.findFirst({
      where: { from_currency: 'USD', to_currency: 'IDR' },
      orderBy: { rate_date: 'desc' },
    });
    if (rateRecord?.rate) {
      usdToIdrRate = Number(rateRecord.rate);
    }
  } catch {
    // Fallback default
  }

  return (
    <html lang={savedLocale} className="max-w-full overflow-x-hidden relative h-full">
      <body className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased max-w-full overflow-x-hidden relative">
        <GoogleAnalytics />
        <SessionProvider>
          <PreferencesProvider
            initialLocale={savedLocale}
            initialCurrency={savedCurrency}
            usdToIdrRate={usdToIdrRate}
          >
            {children}
          </PreferencesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

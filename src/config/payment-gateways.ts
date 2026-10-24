export type SupportedCurrency = 'USD' | 'IDR';

export interface PaymentMethodOption {
  id: string;
  gateway: 'paypal' | 'interactive' | 'midtrans';
  name: string;
  category: 'qris' | 'virtual_account' | 'ewallet' | 'card' | 'paypal';
  supportedCurrencies: SupportedCurrency[];
  feePercent: number;
  feeFixed: number;
  icon: string;
  isActive: boolean;
  badge?: string;
  description: string;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'paypal_smart',
    gateway: 'paypal',
    name: 'PayPal & Kartu Internasional',
    category: 'paypal',
    supportedCurrencies: ['USD'],
    feePercent: 0,
    feeFixed: 0,
    icon: 'paypal',
    isActive: true,
    badge: 'Global & Aman',
    description: 'Bayar dengan saldo PayPal atau kartu kredit internasional (Visa, Mastercard, Amex).',
  },
  {
    id: 'qris_interactive',
    gateway: 'interactive',
    name: 'QRIS Instant',
    category: 'qris',
    supportedCurrencies: ['IDR'],
    feePercent: 0,
    feeFixed: 0,
    icon: 'qris',
    isActive: true,
    badge: 'Bebas Biaya Admin',
    description: 'Pindai instan via BCA Mobile, GoPay, OVO, ShopeePay, Dana, atau mobile banking.',
  },
  {
    id: 'bca_va',
    gateway: 'midtrans',
    name: 'BCA Virtual Account',
    category: 'virtual_account',
    supportedCurrencies: ['IDR'],
    feePercent: 0,
    feeFixed: 0,
    icon: 'bank',
    isActive: true,
    badge: 'Verifikasi Otomatis',
    description: 'Transfer otomatis melalui ATM, m-BCA, atau KlikBCA tanpa bukti transfer manual.',
  },
  {
    id: 'mandiri_va',
    gateway: 'midtrans',
    name: 'Mandiri Virtual Account',
    category: 'virtual_account',
    supportedCurrencies: ['IDR'],
    feePercent: 0,
    feeFixed: 0,
    icon: 'bank',
    isActive: true,
    description: 'Transfer mudah lewat Livin by Mandiri atau ATM Mandiri.',
  },
];

export function getAvailablePaymentMethods(currency: string): PaymentMethodOption[] {
  const curr = (currency || 'USD').toUpperCase() as SupportedCurrency;
  const methods = PAYMENT_METHODS.filter((m) => m.isActive && m.supportedCurrencies.includes(curr));
  if (methods.length === 0) {
    return PAYMENT_METHODS.filter((m) => m.isActive && m.supportedCurrencies.includes('USD'));
  }
  return methods;
}

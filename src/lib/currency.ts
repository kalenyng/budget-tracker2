export const CURRENCIES = {
  ZAR: { symbol: 'R', locale: 'en-ZA', code: 'ZAR' },
  USD: { symbol: '$', locale: 'en-US', code: 'USD' },
  GBP: { symbol: '£', locale: 'en-GB', code: 'GBP' },
  EUR: { symbol: '€', locale: 'de-DE', code: 'EUR' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const { locale, code } = CURRENCIES[currency];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency].symbol;
}

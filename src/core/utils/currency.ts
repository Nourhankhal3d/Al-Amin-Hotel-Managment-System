export const DEFAULT_CURRENCY = 'EGP';
export const DEFAULT_LOCALE = 'ar-EG';

/**
 * Formats an amount as currency.
 * Currency defaults to EGP for the hotel's Egyptian locale,
 * so it can be switched with a single constant change later.
 */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  if (!Number.isFinite(amount)) return '—';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

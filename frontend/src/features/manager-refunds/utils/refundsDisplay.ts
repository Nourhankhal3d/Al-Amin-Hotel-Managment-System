import type { Language } from '../../../core/i18n';
import { formatDate } from '../../../utils/date';
import { formatNumber } from '../../../utils/format';

/** "{amount} ج.م" / "EGP {amount}" from the feature's i18n block */
export function formatMoney(value: number, t: (key: string) => string, language: Language): string {
  return t('currency').replace('{amount}', formatNumber(value, language, 2));
}

export function formatDay(value: string | null | undefined, language: Language): string {
  return value ? formatDate(value, language) || '—' : '—';
}

export function formatRoom(roomNumber: string, language: Language): string {
  return /^\d+$/.test(roomNumber) ? formatNumber(Number(roomNumber), language) : roomNumber;
}

/**
 * "RF-128" -> "RF-١٢٨" in Arabic, as in the design.
 * Wrapped in left-to-right isolate marks so "RF-" stays before the number inside Arabic sentences.
 */
export function formatCode(code: string, language: Language): string {
  const digits = code.replace(/\d+/g, (part) => formatNumber(Number(part), language).replace(/[٬,]/g, ''));
  return `⁦${digits}⁩`;
}

/** Digits only, kept as written (a national ID is not a number to group) */
export function formatDigits(value: string, language: Language): string {
  return language === 'ar' ? value.replace(/\d/g, (digit) => String.fromCharCode(0x0660 + Number(digit))) : value;
}

/** Accepts Arabic or English digits and one decimal point; returns NaN when it is not a number */
export function parseAmount(value: string): number {
  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[٫,]/g, '.')
    .replace(/[^\d.]/g, '');
  if (!normalized || (normalized.match(/\./g) ?? []).length > 1) return Number.NaN;
  return Number(normalized);
}

/**
 * Arabic count words: 1 -> "one", 2 -> "two", 3..10 -> "few", otherwise "many".
 * The i18n block holds `<base>.one|two|few|many` with {count}.
 */
export function pluralText(t: (key: string) => string, base: string, count: number, language: Language): string {
  let form = 'many';
  if (language === 'ar') {
    if (count === 1) form = 'one';
    else if (count === 2) form = 'two';
    else if (count >= 3 && count <= 10) form = 'few';
  } else if (count === 1) {
    form = 'one';
  }
  return t(`${base}.${form}`).replace('{count}', formatNumber(count, language));
}

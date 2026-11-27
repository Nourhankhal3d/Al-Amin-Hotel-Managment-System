import type { Language } from '../../../core/i18n';
import { formatDate } from '../../../utils/date';
import { formatNumber } from '../../../utils/format';

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Today", "Yesterday" or the date */
export function dayLabel(value: string, t: (key: string) => string, language: Language, now = Date.now()): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  if (isSameDay(date, new Date(now))) return t('today');
  if (isSameDay(date, new Date(now - 24 * 60 * 60 * 1000))) return t('yesterday');
  return formatDate(date, language);
}

/** Cards show two digits, as in the design: 2 -> ٠٢ */
export function twoDigits(value: number, language: Language): string {
  return value >= 0 && value < 10 ? `${formatNumber(0, language)}${formatNumber(value, language)}` : formatNumber(value, language);
}

/** 26800 -> "٢٦٫٨ ألف" / "26.8K" */
export function formatCompact(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** One decimal: 4.7 -> ٤٫٧ */
export function formatScore(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
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

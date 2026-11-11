import type { Language } from '../../../core/i18n';
import { formatClock, formatNumber } from '../../../utils/format';

/** Cards show two digits, as in the design: 4 -> ٠٤ */
export function twoDigits(value: number, language: Language): string {
  return value >= 0 && value < 10 ? `${formatNumber(0, language)}${formatNumber(value, language)}` : formatNumber(value, language);
}

export function formatTime(value: string | null | undefined, language: Language): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? formatClock(date, language) : '—';
}

export function formatRoom(roomNumber: string, language: Language): string {
  return /^\d+$/.test(roomNumber) ? formatNumber(Number(roomNumber), language) : roomNumber;
}

/**
 * "MT-128" -> "MT-١٢٨" in Arabic, as in the design.
 * Wrapped in left-to-right isolate marks so "MT-" stays before the number inside Arabic sentences.
 */
export function formatCode(code: string, language: Language): string {
  const digits = code.replace(/\d+/g, (part) => formatNumber(Number(part), language).replace(/[٬,]/g, ''));
  return `⁦${digits}⁩`;
}

/** "{minutes} د" / "{minutes} min" */
export function formatMinutes(minutes: number, t: (key: string) => string, language: Language): string {
  return t('minutesShort').replace('{minutes}', formatNumber(Math.round(minutes), language));
}

/** Relative "last update": "منذ ٨ د", "منذ ساعة", then the clock time for older updates */
export function formatSince(value: string, t: (key: string) => string, language: Language, now = Date.now()): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '—';
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (minutes < 1) return t('since.now');
  if (minutes < 60) return t('since.minutes').replace('{minutes}', formatNumber(minutes, language));
  if (minutes < 120) return t('since.hour');
  if (new Date(timestamp).toDateString() === new Date(now).toDateString()) return formatClock(new Date(timestamp), language);
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-EG', { day: 'numeric', month: 'short' }).format(new Date(timestamp));
}

export function isToday(value: string, now = Date.now()): boolean {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toDateString() === new Date(now).toDateString();
}

/** ISO date-time -> "HH:MM" for <input type="time"> (local time) */
export function toTimeInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** "HH:MM" -> ISO date-time today (local time), or null when empty */
export function fromTimeInput(value: string): string | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toISOString();
}

export function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
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

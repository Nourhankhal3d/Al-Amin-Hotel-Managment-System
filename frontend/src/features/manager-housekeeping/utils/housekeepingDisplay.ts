import type { Language } from '../../../core/i18n';
import { formatClock, formatNumber } from '../../../utils/format';

/** Cards show two digits, as in the design: 6 -> ٠٦ */
export function twoDigits(value: number, language: Language): string {
  return value >= 0 && value < 10 ? `${formatNumber(0, language)}${formatNumber(value, language)}` : formatNumber(value, language);
}

/** Clock time for today ("11:18 AM"); day and time for older tasks ("9 Nov, 11:18 AM") */
export function formatTime(value: string | null | undefined, language: Language, now = Date.now()): string {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  if (isSameDay(date, new Date(now))) return formatClock(date, language);
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h12',
  }).format(date);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Floor from the rooms list; when the room is missing there, the first digit of its number (305 -> 3) */
export function floorOf(roomNumber: string, knownFloor: number | null | undefined): number | null {
  if (typeof knownFloor === 'number' && Number.isFinite(knownFloor)) return knownFloor;
  const digit = Number(roomNumber.charAt(0));
  return /^\d{3,}$/.test(roomNumber) && digit > 0 ? digit : null;
}

export function formatRoom(roomNumber: string, language: Language): string {
  return /^\d+$/.test(roomNumber) ? formatNumber(Number(roomNumber), language) : roomNumber;
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

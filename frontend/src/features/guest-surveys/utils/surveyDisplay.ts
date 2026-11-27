import type { Language } from '../../../core/i18n';
import { formatDate } from '../../../utils/date';
import { formatNumber } from '../../../utils/format';
import { RATING_QUESTIONS, type SurveyRatings } from '../types/guestSurveys.types';

/** Cards show two digits, as in the design: 6 -> ٠٦ */
export function twoDigits(value: number, language: Language): string {
  return value >= 0 && value < 10 ? `${formatNumber(0, language)}${formatNumber(value, language)}` : formatNumber(value, language);
}

export function formatRoom(roomNumber: string, language: Language): string {
  return /^\d+$/.test(roomNumber) ? formatNumber(Number(roomNumber), language) : roomNumber;
}

/** One decimal: 4.7 -> ٤٫٧ */
export function formatScore(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/** The survey's score: average of its eight star questions */
export function surveyScore(ratings: SurveyRatings): number {
  const values = RATING_QUESTIONS.map((question) => ratings[question]).filter((value) => value > 0);
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

/** Word for an average score: excellent, very good, good or needs work */
export function scoreLevel(score: number): 'excellent' | 'veryGood' | 'good' | 'needsWork' {
  if (score >= 4.5) return 'excellent';
  if (score >= 4) return 'veryGood';
  if (score >= 3) return 'good';
  return 'needsWork';
}

export function formatDay(value: string | null, language: Language): string {
  return value ? formatDate(value, language) || '—' : '—';
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** "Checks out today", "Checked out yesterday" or "Checked out on 16 June" */
export function departureText(t: (key: string) => string, value: string | null, language: Language, now = Date.now()): string {
  if (!value) return t('departure.unknown');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return t('departure.unknown');
  const today = new Date(now);
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  if (dayKey(date) === dayKey(today)) return t('departure.today');
  if (dayKey(date) === dayKey(yesterday)) return t('departure.yesterday');
  return t('departure.onDate').replace('{date}', formatDate(date, language));
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

/** Room types the API sends in English (single, double, suite, vip) shown in the page language */
export function roomTypeText(t: (key: string) => string, roomType: string | null): string {
  if (!roomType) return '—';
  const key = `roomTypes.${roomType.toLowerCase()}`;
  const text = t(key);
  return text.endsWith(key) ? roomType : text;
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

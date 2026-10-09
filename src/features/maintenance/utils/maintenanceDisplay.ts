import { getTranslation, type Language } from '../../../core/i18n';
import { formatClock, formatNumber } from '../../../utils/format';
import type { MaintenanceRequest } from '../types/maintenance.types';

export function formatReference(referenceNumber: number, language: Language): string {
  return `MT-${formatNumber(referenceNumber, language)}`;
}

export function formatRequestTime(isoDate: string, language: Language): string {
  return formatClock(new Date(isoDate), language);
}

// "منذ ٨ د", "منذ ساعة", ... ; older than a day falls back to the clock time
export function formatTimeAgo(isoDate: string, language: Language, now = new Date()): string {
  const t = (key: string) => getTranslation(language, key);
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(isoDate).getTime()) / 60_000));
  if (minutes < 1) return t('mtAgoNow');
  if (minutes < 60) return t('mtAgoMinutes').replace('{n}', formatNumber(minutes, language));
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return t('mtAgoHour');
  if (hours < 24) return t('mtAgoHours').replace('{n}', formatNumber(hours, language));
  return formatRequestTime(isoDate, language);
}

/** Average minutes from report to resolution, or null when nothing is resolved yet */
export function averageResolutionMinutes(requests: MaintenanceRequest[]): number | null {
  const durations = requests
    .filter((request) => request.status === 'resolved' && request.resolvedAt)
    .map((request) => (new Date(request.resolvedAt as string).getTime() - new Date(request.reportedAt).getTime()) / 60_000);
  if (durations.length === 0) return null;
  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

export function isToday(isoDate: string, now = new Date()): boolean {
  return new Date(isoDate).toDateString() === now.toDateString();
}

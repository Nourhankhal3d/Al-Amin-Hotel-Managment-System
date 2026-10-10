import type { Language } from '../../../core/i18n';

// Times are always shown in hotel time (Cairo), whatever the device's time zone.
// TODO: remove once utils/format.ts formatClock uses timeZone 'Africa/Cairo', and use formatClock again.
const HOTEL_TIME_ZONE = 'Africa/Cairo';

// TEMP: the floor is the first digit of the room number until the backend sends it
export function getFloor(roomNumber: string): string {
  return roomNumber.charAt(0);
}

export function formatTaskTime(isoDate: string, language: Language): string {
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h12',
    timeZone: HOTEL_TIME_ZONE,
  }).format(new Date(isoDate));
}
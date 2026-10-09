import type { Language } from '../../../core/i18n';
import { formatClock } from '../../../utils/format';

// TEMP: the floor is the first digit of the room number until the backend sends it
export function getFloor(roomNumber: string): string {
  return roomNumber.charAt(0);
}

export function formatTaskTime(isoDate: string, language: Language): string {
  return formatClock(new Date(isoDate), language);
}

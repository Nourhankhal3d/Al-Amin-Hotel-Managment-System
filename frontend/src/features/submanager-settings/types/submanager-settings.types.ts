import type { Language } from '../../../core/i18n';
import type { ThemeMode } from '../../../core/theme/themeContextInstance';

export interface SubManagerHotelSettings {
  hotelName: string;
  location: string;
  floorsCount: number;
  totalRooms: number;
}

export interface SubManagerNotificationSettings {
  payments: boolean;
  reports: boolean;
}

export interface SubManagerSettings {
  hotel: SubManagerHotelSettings;
  notifications: SubManagerNotificationSettings;
  appearance: ThemeMode;
  language: Language;
}

export interface ShiftConfiguration {
  id: 'morning' | 'evening' | 'night';
  name: string;
  startTime: string;
  endTime: string;
}

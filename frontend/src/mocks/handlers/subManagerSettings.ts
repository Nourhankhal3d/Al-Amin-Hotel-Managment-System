import { http, HttpResponse } from 'msw';
import type { SubManagerSettings } from '../../features/submanager-settings/types/submanager-settings.types';

const API = '/api/v1';

let settings: SubManagerSettings = {
  hotel: {
    hotelName: 'فندق الأمين - أسوان',
    location: 'أسوان، مصر',
    floorsCount: 3,
    totalRooms: 36,
  },
  notifications: {
    payments: true,
    reports: false,
  },
  appearance: 'light',
  language: 'ar',
};

export const subManagerSettingsHandlers = [
  http.get(`${API}/sub-manager/settings`, () => HttpResponse.json(settings)),
  http.patch(`${API}/sub-manager/settings`, async ({ request }) => {
    const updatedSettings = (await request.json()) as SubManagerSettings;
    settings = updatedSettings;
    return HttpResponse.json(settings);
  }),
];

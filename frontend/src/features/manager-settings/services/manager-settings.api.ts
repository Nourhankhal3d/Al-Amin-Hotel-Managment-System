import { request } from '../../../core/api/apiClient';
import type {
  ManagerSettings,
  HotelInfoSettings,
  ShiftTiming,
  NotificationSettings,
  AppearanceMode,
  ApiHotelSettings,
  ApiShiftSettings,
  ApiNotificationPreferences,
} from '../types/manager-settings.types';

// Helper to make API calls with fallback to legacy route if needed
async function requestWithFallback<T>(
  primaryPath: string,
  fallbackPath: string,
  options?: Parameters<typeof request>[1],
): Promise<T> {
  try {
    return await request<T>(primaryPath, options);
  } catch (err) {
    try {
      return await request<T>(fallbackPath, options);
    } catch {
      throw err;
    }
  }
}

// Helpers for Shift formatting
function formatHour(val: number | string | undefined, defaultVal: string): string {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'number') {
    return `${String(val).padStart(2, '0')}:00`;
  }
  const str = String(val).trim();
  if (/^\d{1,2}$/.test(str)) {
    return `${str.padStart(2, '0')}:00`;
  }
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    return str.padStart(5, '0');
  }
  return str || defaultVal;
}

function parseHour(val: string | number | undefined, defaultVal: number): number {
  if (typeof val === 'number') return val;
  if (!val) return defaultVal;
  const match = String(val).match(/^(\d{1,2})/);
  return match ? parseInt(match[1], 10) : defaultVal;
}

// ---------- Mappers between Contract Sec 12 Schemas & UI Models ----------
function mapApiToHotelInfo(api: ApiHotelSettings): HotelInfoSettings {
  return {
    hotelName: api?.name || '',
    location: api?.location || '',
    floorsCount: api?.floors_count ?? 1,
    totalRooms: api?.total_rooms ?? 0,
  };
}

function mapHotelInfoToApi(info: Partial<HotelInfoSettings>): Partial<ApiHotelSettings> {
  return {
    name: info.hotelName,
    location: info.location,
    floors_count: info.floorsCount,
    total_rooms: info.totalRooms,
  };
}

function mapApiToShifts(api: ApiShiftSettings): ShiftTiming[] {
  return [
    {
      id: 'morning',
      name: 'الصباحية',
      startTime: formatHour(api?.morning?.start, '07:00'),
      endTime: formatHour(api?.morning?.end, '16:00'),
    },
    {
      id: 'evening',
      name: 'المسائية',
      startTime: formatHour(api?.evening?.start, '16:00'),
      endTime: formatHour(api?.evening?.end, '23:00'),
    },
    {
      id: 'night',
      name: 'الليلية',
      startTime: formatHour(api?.night?.start, '23:00'),
      endTime: formatHour(api?.night?.end, '07:00'),
    },
  ];
}

function mapShiftsToApi(shifts: ShiftTiming[]): any {
  const morning = shifts.find((s) => s.id === 'morning') || { startTime: '07:00', endTime: '16:00' };
  const evening = shifts.find((s) => s.id === 'evening') || { startTime: '16:00', endTime: '23:00' };
  const night = shifts.find((s) => s.id === 'night') || { startTime: '23:00', endTime: '07:00' };

  return {
    morning: { start: parseHour(morning.startTime, 7), end: parseHour(morning.endTime, 16) },
    evening: { start: parseHour(evening.startTime, 16), end: parseHour(evening.endTime, 23) },
    night: { start: parseHour(night.startTime, 23), end: parseHour(night.endTime, 7) },
  };
}

function mapApiToNotifications(api: ApiNotificationPreferences): NotificationSettings {
  const approval = api?.approval_request ?? api?.approval_requests ?? true;
  const leave = api?.leave_request ?? api?.leave_requests ?? true;
  const maintenance = api?.critical_maintenance ?? true;
  const complaint = api?.critical_complaint ?? api?.critical_complaints ?? true;
  const shiftReport = api?.shift_report_submitted ?? api?.shift_reports ?? true;
  const system = api?.system ?? api?.system_alerts ?? true;

  return {
    maintenance,
    cleaning: complaint,
    payments: approval,
    pendingTasks: system,
    shiftHandover: leave,
    reports: shiftReport,
    approval_requests: approval,
    leave_requests: leave,
    critical_maintenance: maintenance,
    critical_complaints: complaint,
    shift_reports: shiftReport,
    system_alerts: system,
  };
}

function mapNotificationsToApi(notifs: Partial<NotificationSettings>): Record<string, boolean> {
  const payload: Record<string, boolean> = {};

  if (notifs.payments !== undefined || notifs.approval_requests !== undefined) {
    const val = (notifs.approval_requests ?? notifs.payments)!;
    payload.approval_request = val;
    payload.approval_requests = val;
  }
  if (notifs.shiftHandover !== undefined || notifs.leave_requests !== undefined) {
    const val = (notifs.leave_requests ?? notifs.shiftHandover)!;
    payload.leave_request = val;
    payload.leave_requests = val;
  }
  if (notifs.maintenance !== undefined || notifs.critical_maintenance !== undefined) {
    payload.critical_maintenance = (notifs.critical_maintenance ?? notifs.maintenance)!;
  }
  if (notifs.cleaning !== undefined || notifs.critical_complaints !== undefined) {
    const val = (notifs.critical_complaints ?? notifs.cleaning)!;
    payload.critical_complaint = val;
    payload.critical_complaints = val;
  }
  if (notifs.reports !== undefined || notifs.shift_reports !== undefined) {
    const val = (notifs.shift_reports ?? notifs.reports)!;
    payload.shift_report_submitted = val;
    payload.shift_reports = val;
  }
  if (notifs.pendingTasks !== undefined || notifs.system_alerts !== undefined) {
    const val = (notifs.system_alerts ?? notifs.pendingTasks)!;
    payload.system = val;
    payload.system_alerts = val;
  }

  return payload;
}

// ---------- Contract Sec 12 Endpoints ----------

/**
 * GET /api/v1/manager/hotel-settings or /api/v1/hotel-settings
 */
export async function getHotelSettings(): Promise<HotelInfoSettings> {
  const res = await requestWithFallback<{ data: ApiHotelSettings } | ApiHotelSettings>(
    '/manager/hotel-settings',
    '/hotel-settings',
  );
  const data = 'data' in res && res.data ? res.data : (res as ApiHotelSettings);
  return mapApiToHotelInfo(data);
}

/**
 * PATCH /api/v1/manager/hotel-settings or /api/v1/hotel-settings
 */
export async function updateHotelSettings(payload: Partial<HotelInfoSettings>): Promise<HotelInfoSettings> {
  const body = mapHotelInfoToApi(payload);
  const res = await requestWithFallback<{ data: ApiHotelSettings } | ApiHotelSettings>(
    '/manager/hotel-settings',
    '/hotel-settings',
    {
      method: 'PATCH',
      body,
    },
  );
  const data = 'data' in res && res.data ? res.data : (res as ApiHotelSettings);
  return mapApiToHotelInfo(data);
}

/**
 * GET /api/v1/manager/shift-settings or /api/v1/shift-settings
 */
export async function getShiftSettings(): Promise<ShiftTiming[]> {
  const res = await requestWithFallback<{ data: ApiShiftSettings } | ApiShiftSettings>(
    '/manager/shift-settings',
    '/shift-settings',
  );
  const data = 'data' in res && res.data ? res.data : (res as ApiShiftSettings);
  return mapApiToShifts(data);
}

/**
 * PATCH /api/v1/manager/shift-settings or /api/v1/shift-settings
 */
export async function updateShiftSettings(shifts: ShiftTiming[]): Promise<ShiftTiming[]> {
  const body = mapShiftsToApi(shifts);
  const res = await requestWithFallback<{ data: ApiShiftSettings } | ApiShiftSettings>(
    '/manager/shift-settings',
    '/shift-settings',
    {
      method: 'PATCH',
      body,
    },
  );
  const data = 'data' in res && res.data ? res.data : (res as ApiShiftSettings);
  return mapApiToShifts(data);
}

/**
 * GET /api/v1/manager/notifications/preferences or /api/v1/notifications/preferences
 */
export async function getNotificationPreferences(): Promise<NotificationSettings> {
  const res = await requestWithFallback<{ data: ApiNotificationPreferences } | ApiNotificationPreferences>(
    '/manager/notifications/preferences',
    '/notifications/preferences',
  );
  const data = 'data' in res && res.data ? res.data : (res as ApiNotificationPreferences);
  return mapApiToNotifications(data);
}

/**
 * PATCH /api/v1/manager/notifications/preferences or /api/v1/notifications/preferences
 */
export async function updateNotificationPreferences(
  payload: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const body = mapNotificationsToApi(payload);
  const res = await requestWithFallback<{ data: ApiNotificationPreferences } | ApiNotificationPreferences>(
    '/manager/notifications/preferences',
    '/notifications/preferences',
    {
      method: 'PATCH',
      body,
    },
  );
  const data = 'data' in res && res.data ? res.data : (res as ApiNotificationPreferences);
  return mapApiToNotifications(data);
}

/**
 * Aggregated Settings Service for ManagerSettingsPage
 */
export async function getManagerSettings(): Promise<ManagerSettings> {
  const [hotelInfoResult, shiftsResult, notificationsResult] = await Promise.allSettled([
    getHotelSettings(),
    getShiftSettings(),
    getNotificationPreferences(),
  ]);

  // If all three failed, throw to surface the error
  if (
    hotelInfoResult.status === 'rejected' &&
    shiftsResult.status === 'rejected' &&
    notificationsResult.status === 'rejected'
  ) {
    throw (hotelInfoResult as PromiseRejectedResult).reason || new Error('Failed to load settings');
  }

  const hotelInfo =
    hotelInfoResult.status === 'fulfilled'
      ? hotelInfoResult.value
      : {
          hotelName: 'Al-Amin Hotel',
          location: '',
          floorsCount: 3,
          totalRooms: 12,
        };

  const shifts: ShiftTiming[] =
    shiftsResult.status === 'fulfilled'
      ? shiftsResult.value
      : [
          { id: 'morning', name: 'الصباحية', startTime: '07:00', endTime: '16:00' },
          { id: 'evening', name: 'المسائية', startTime: '16:00', endTime: '23:00' },
          { id: 'night', name: 'الليلية', startTime: '23:00', endTime: '07:00' },
        ];

  const notifications =
    notificationsResult.status === 'fulfilled'
      ? notificationsResult.value
      : {
          maintenance: true,
          cleaning: true,
          payments: true,
          pendingTasks: true,
          shiftHandover: true,
          reports: true,
        };

  const savedTheme =
    typeof window !== 'undefined'
      ? ((localStorage.getItem('al-amin-theme') as AppearanceMode) ||
        (localStorage.getItem('theme') as AppearanceMode) ||
        'light')
      : 'light';

  return {
    hotelInfo,
    shifts,
    notifications,
    language: 'ar',
    appearance: savedTheme,
    lastAutoSaved: new Date().toISOString(),
  };
}

export async function updateManagerSettings(
  settings: Partial<ManagerSettings>,
): Promise<ManagerSettings> {
  const promises: Promise<unknown>[] = [];

  if (settings.hotelInfo) {
    promises.push(updateHotelSettings(settings.hotelInfo));
  }
  if (settings.shifts) {
    promises.push(updateShiftSettings(settings.shifts));
  }
  if (settings.notifications) {
    promises.push(updateNotificationPreferences(settings.notifications));
  }

  await Promise.all(promises);
  return getManagerSettings();
}

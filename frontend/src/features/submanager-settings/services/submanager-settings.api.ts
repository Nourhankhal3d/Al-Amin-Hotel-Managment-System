import { request } from '../../../core/api/apiClient';
import type { SubManagerSettings } from '../types/submanager-settings.types';

export async function getSubManagerSettings(): Promise<SubManagerSettings> {
  return request<SubManagerSettings>('/sub-manager/settings');
}

export async function updateSubManagerSettings(
  settings: SubManagerSettings,
): Promise<SubManagerSettings> {
  return request<SubManagerSettings>('/sub-manager/settings', {
    method: 'PATCH',
    body: settings,
  });
}

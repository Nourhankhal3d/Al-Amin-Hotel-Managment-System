
import { request } from '../../../core/api/apiClient';
import type { Paginated } from '../../../core/api/api.types';
import type { MaintenanceRequest } from '../types/maintenance.types';

export async function getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  const response = await request<Paginated<MaintenanceRequest>>('/maintenance-issues');
  return response.data;
}
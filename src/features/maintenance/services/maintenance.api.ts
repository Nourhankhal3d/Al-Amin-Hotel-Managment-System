import { apiRequest } from '../../../core/api/apiClient';
import type { MaintenanceRequest } from '../types/maintenance.types';

export async function getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  return apiRequest<MaintenanceRequest[]>('/maintenance/requests');
}

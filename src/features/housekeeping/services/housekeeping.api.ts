import { apiRequest } from '../../../core/api/apiClient';
import type { HousekeepingTask } from '../types/housekeeping.types';

export async function getHousekeepingTasks(): Promise<HousekeepingTask[]> {
  return apiRequest<HousekeepingTask[]>('/housekeeping/tasks');
}

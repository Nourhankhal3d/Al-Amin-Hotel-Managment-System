
import { request } from '../../../core/api/apiClient';
import type { Paginated } from '../../../core/api/api.types';
import type { HousekeepingTask } from '../types/housekeeping.types';

export async function getHousekeepingTasks(): Promise<HousekeepingTask[]> {
  const response = await request<Paginated<HousekeepingTask>>('/cleaning-tasks');
  return response.data;
}
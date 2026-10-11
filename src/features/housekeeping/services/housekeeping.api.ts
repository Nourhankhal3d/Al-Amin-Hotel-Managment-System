import { request } from '../../../core/api/apiClient';
import type { Paginated } from '../../../core/api/api.types';
import { HK_FETCH_LIMIT } from '../constants/housekeeping.constants';
import type { CleaningTaskCreate, CleaningTaskUpdate, HousekeepingTask } from '../types/housekeeping.types';

export async function getHousekeepingTasks(): Promise<HousekeepingTask[]> {
  const response = await request<Paginated<HousekeepingTask>>('/cleaning-tasks', {
    params: { page: 1, limit: HK_FETCH_LIMIT },
  });
  return response.data;
}

export async function createHousekeepingTask(body: CleaningTaskCreate): Promise<HousekeepingTask> {
  return request<HousekeepingTask>('/cleaning-tasks', {
    method: 'POST',
    body,
  });
}

export async function updateHousekeepingTask(taskId: number, body: CleaningTaskUpdate): Promise<HousekeepingTask> {
  return request<HousekeepingTask>(`/cleaning-tasks/${taskId}`, {
    method: 'PATCH',
    body,
  });
}

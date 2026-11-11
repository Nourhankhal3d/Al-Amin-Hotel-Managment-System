import { request } from '../../../core/api/apiClient';
import type {
  ApiHousekeepingTask,
  ApiList,
  ApiRoom,
  ApiStaffMember,
  CleanerOption,
  HousekeepingTask,
  HousekeepingTaskAssign,
  HousekeepingTaskCreate,
  RoomOption,
} from '../types/manager-housekeeping.types';

// Manager API Contract v1.2, section 11.3
const BASE = '/manager/housekeeping-tasks';

/** The API sends { data: task }; accept a bare task too */
function unwrap<T>(response: T | { data: T }): T {
  return response && typeof response === 'object' && 'data' in response ? (response as { data: T }).data : response as T;
}

export function toHousekeepingTask(api: ApiHousekeepingTask): HousekeepingTask {
  return {
    id: String(api.task_id),
    roomId: String(api.room_id ?? ''),
    roomNumber: String(api.room_number ?? ''),
    cleanerId: api.assigned_to_staff_id ?? null,
    cleanerName: api.cleaner_name ?? null,
    priority: api.priority ?? 'NORMAL',
    status: api.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
    notes: api.notes ?? '',
    createdAt: api.created_at,
  };
}

/** GET /manager/housekeeping-tasks (100 is the largest page the API allows) */
export async function getHousekeepingTasks(): Promise<HousekeepingTask[]> {
  const response = await request<ApiList<ApiHousekeepingTask>>(BASE, { params: { limit: 100 } });
  return (response.data ?? []).map(toHousekeepingTask);
}

/** GET /manager/staff — active housekeepers only (the API refuses any other role on a task) */
export async function getCleaners(): Promise<CleanerOption[]> {
  const response = await request<ApiList<ApiStaffMember>>('/manager/staff', {
    params: { staff_type: 'HOUSEKEEPER', is_active: 'true', limit: 100 },
  });
  return (response.data ?? []).map((staff) => ({ id: String(staff.staff_id), name: staff.full_name }));
}

/** GET /manager/rooms — every room in one call (200 is the largest page the API allows) */
export async function getRooms(): Promise<RoomOption[]> {
  const response = await request<ApiList<ApiRoom>>('/manager/rooms', { params: { limit: 200 } });
  return (response.data ?? []).map((room) => ({
    roomId: String(room.room_id),
    roomNumber: String(room.room_number),
    floor: room.floor ?? null,
    guestName: room.current_guest_name ?? null,
  }));
}

/** PATCH /manager/housekeeping-tasks/{id}/assign */
export async function assignHousekeepingTask(id: string, body: HousekeepingTaskAssign): Promise<HousekeepingTask> {
  const response = await request<ApiHousekeepingTask | { data: ApiHousekeepingTask }>(
    `${BASE}/${encodeURIComponent(id)}/assign`,
    { method: 'PATCH', body },
  );
  return toHousekeepingTask(unwrap(response));
}

/** POST /manager/housekeeping-tasks — not in the contract yet. TODO: the backend adds it. */
export async function createHousekeepingTask(body: HousekeepingTaskCreate): Promise<HousekeepingTask> {
  const response = await request<ApiHousekeepingTask | { data: ApiHousekeepingTask }>(BASE, { method: 'POST', body });
  return toHousekeepingTask(unwrap(response));
}

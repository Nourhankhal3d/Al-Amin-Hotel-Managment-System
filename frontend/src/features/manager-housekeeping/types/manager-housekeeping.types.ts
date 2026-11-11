// Names follow Manager API Contract v1.2: section 11.3 (Housekeeping Tasks), plus the staff and rooms lists
// (GET /manager/staff, GET /manager/rooms) for the pickers. Only the creating of a task is not in the contract yet.

export type HousekeepingPriority = 'RUSH' | 'HIGH' | 'NORMAL' | 'LOW';
export type HousekeepingStatus = 'PENDING' | 'COMPLETED';

/** GET /manager/housekeeping-tasks item */
export interface ApiHousekeepingTask {
  task_id: string;
  room_id: string;
  room_number: string;
  cleaner_name: string | null;
  assigned_to_staff_id: string | null;
  priority: HousekeepingPriority;
  status: HousekeepingStatus;
  notes: string;
  created_at: string;
}

/** GET /manager/staff?staff_type=HOUSEKEEPER item (only the fields this page reads) */
export interface ApiStaffMember {
  staff_id: string;
  full_name: string;
}

/** GET /manager/rooms item (only the fields this page reads) */
export interface ApiRoom {
  room_id: string;
  room_number: string;
  floor: number | null;
  current_guest_name?: string | null;
}

export interface ApiList<T> {
  data: T[];
}

/** Task as the page uses it */
export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  cleanerId: string | null;
  cleanerName: string | null;
  priority: HousekeepingPriority;
  status: HousekeepingStatus;
  notes: string;
  createdAt: string;
}

export interface CleanerOption {
  id: string;
  name: string;
}

export interface RoomOption {
  roomId: string;
  roomNumber: string;
  floor: number | null;
  guestName: string | null;
}

/**
 * PATCH /manager/housekeeping-tasks/{id}/assign — only the fields that changed.
 * The priority can only go up; a completed task cannot be edited.
 */
export interface HousekeepingTaskAssign {
  assigned_to_staff_id?: string | null;
  cleaner_name?: string | null;
  priority?: HousekeepingPriority;
}

/**
 * POST /manager/housekeeping-tasks — not in the contract yet (proposal for the backend).
 * Same fields as the receptionist's POST /cleaning-tasks, plus the housekeeper's staff id when one is picked.
 */
export interface HousekeepingTaskCreate {
  room_id: string;
  priority: HousekeepingPriority;
  cleaner_name?: string;
  assigned_to_staff_id?: string;
  notes?: string;
}

export interface HousekeepingFilters {
  q: string;
  cleaner: string;
  status: HousekeepingStatus | '';
  priority: HousekeepingPriority | '';
  floor: string;
  page: number;
}

export type HousekeepingFilterName = 'cleaner' | 'status' | 'priority' | 'floor';

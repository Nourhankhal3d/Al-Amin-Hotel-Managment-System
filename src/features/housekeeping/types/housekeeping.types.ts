import type {
  CleaningTaskStatus,
  Priority,
} from '../../../types/common.types';

export interface HousekeepingTask {
  task_id: number;
  room_id: number;
  priority: Priority;
  status: CleaningTaskStatus;
  assigned_date: string;
  shift_id: number;
  notes?: string | null;
  cleaner_name?: string | null;
  finished_date?: string | null;
  assigned_by_staff_id?: number | null;
}

export interface CleaningTaskCreate {
  room_id: number;
  priority: Priority;
  cleaner_name?: string;
  notes?: string;
}

export interface CleaningTaskUpdate {
  cleaner_name?: string;
  priority?: Priority;
  notes?: string;
  status?: 'done'; // الموظف يقدر ينقل pending إلى done بس
}
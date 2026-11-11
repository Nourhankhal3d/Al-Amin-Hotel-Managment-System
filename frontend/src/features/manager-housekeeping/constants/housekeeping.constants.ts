import type { BadgeTone } from '../../../components/ui/Badge';
import type { HousekeepingPriority, HousekeepingStatus } from '../types/manager-housekeeping.types';

export const HOUSEKEEPING_I18N = 'manager.housekeeping';
export const HOUSEKEEPING_PAGE_SIZE = 5;

export const STATUS_OPTIONS: HousekeepingStatus[] = ['PENDING', 'COMPLETED'];
/** Same order as the receptionist's form: low to urgent */
export const PRIORITY_OPTIONS: HousekeepingPriority[] = ['LOW', 'NORMAL', 'HIGH', 'RUSH'];

/** Contract rule: a task's priority can only go up (LOW < NORMAL < HIGH < RUSH) */
export const PRIORITY_RANK: Record<HousekeepingPriority, number> = { LOW: 1, NORMAL: 2, HIGH: 3, RUSH: 4 };

/** "High priority" card: high + urgent tasks that are still pending */
export const HIGH_PRIORITIES: HousekeepingPriority[] = ['RUSH', 'HIGH'];

export const STATUS_TONE: Record<HousekeepingStatus, BadgeTone> = {
  PENDING: 'warning',
  COMPLETED: 'success',
};

export const PRIORITY_TONE: Record<HousekeepingPriority, BadgeTone> = {
  RUSH: 'danger',
  HIGH: 'warning',
  NORMAL: 'neutral',
  LOW: 'success',
};

/** Same limits as the receptionist's cleaning task form */
export const NOTES_MAX_LENGTH = 500;
export const CLEANER_MAX_LENGTH = 60;

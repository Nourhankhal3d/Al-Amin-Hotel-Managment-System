import type { BadgeTone } from '../../../components/ui/Badge';
import type { MaintenancePriority, MaintenanceStatus } from '../types/manager-maintenance.types';

export const MAINTENANCE_I18N = 'manager.maintenance';
export const MAINTENANCE_PAGE_SIZE = 4;

export const STATUS_OPTIONS: MaintenanceStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
/** Same order as the receptionist's form: low to urgent */
export const PRIORITY_OPTIONS: MaintenancePriority[] = ['LOW', 'NORMAL', 'HIGH', 'RUSH'];

/** "Active" = still needs work */
export const ACTIVE_STATUSES: MaintenanceStatus[] = ['OPEN', 'IN_PROGRESS'];

/** Technician filter value for tickets nobody was assigned to */
export const UNASSIGNED = 'NONE';

export const STATUS_TONE: Record<MaintenanceStatus, BadgeTone> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
};

export const PRIORITY_TONE: Record<MaintenancePriority, BadgeTone> = {
  RUSH: 'danger',
  HIGH: 'warning',
  NORMAL: 'neutral',
  LOW: 'success',
};

/** Same limits as the receptionist's maintenance form */
export const PROBLEM_MIN_LENGTH = 3;
export const PROBLEM_MAX_LENGTH = 120;
export const NOTES_MAX_LENGTH = 500;

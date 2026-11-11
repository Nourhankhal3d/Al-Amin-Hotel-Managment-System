import type { BadgeTone } from '../../../components/ui/Badge';
import type { ApprovalStatus, RefundType } from '../types/manager-refunds.types';

export const REFUNDS_I18N = 'manager.refunds';

/** Still waiting for the manager's decision (the contract has no "in review" state) */
export const OPEN_STATUSES: ApprovalStatus[] = ['PENDING'];

export const STATUS_TONE: Record<ApprovalStatus, BadgeTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export const TYPE_TONE: Record<RefundType, BadgeTone> = {
  FULL: 'neutral',
  PARTIAL: 'neutral',
};

export const NOTES_MAX_LENGTH = 500;

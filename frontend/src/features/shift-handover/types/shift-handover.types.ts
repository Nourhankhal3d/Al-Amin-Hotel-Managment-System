export type ShiftType = 'morning' | 'evening' | 'night';

export type ShiftStatus = 'active' | 'handed_over';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type CleaningTaskStatus = 'pending' | 'done';

export type MaintenanceIssueStatus = 'open' | 'in_progress' | 'resolved';

export type PaymentMethod = 'cash' | 'instapay' | 'vodafone_cash';

export interface Shift {
  shift_id: string;
  staff_id: string;
  shift_date: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  handed_over_at?: string | null;
  shift_notes?: string | null;
}

export interface PaymentTotals {
  cash: number;
  instapay: number;
  vodafone_cash: number;
  total: number;
}

export interface CleaningTask {
  task_id: string;
  room_id: string;
  priority: Priority;
  status: CleaningTaskStatus;
  assigned_date: string;
  shift_id: string | null;
  notes?: string | null;
  cleaner_name?: string | null;
  finished_date?: string | null;
  assigned_by_staff_id?: string | null;
}

export interface MaintenanceIssue {
  issue_id: string;
  room_id: string;
  problem: string;
  priority: Priority;
  status: MaintenanceIssueStatus;
  created_date: string;
  shift_id: string;
  staff_id: string;
  notes?: string | null;
  resolved_date?: string | null;
}

export interface Payment {
  payment_id: string;
  reservation_id: string;
  staff_id: string;
  shift_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_datetime: string;
  payment_verified: boolean;
  notes?: string | null;
  reversal_of_payment_id?: string | null;
}

export interface PendingItems {
  cleaning_tasks: CleaningTask[];
  maintenance_issues: MaintenanceIssue[];
  unverified_payments: Payment[];
}

export interface ShiftSummary {
  shift: Shift;
  payments: PaymentTotals;
  check_ins: number;
  check_outs: number;
  rooms_handled: string[];
  cleaning_tasks: CleaningTask[];
  maintenance_issues: MaintenanceIssue[];
  pending: PendingItems;
}

export interface HandoverRequest {
  shift_notes?: string;
}
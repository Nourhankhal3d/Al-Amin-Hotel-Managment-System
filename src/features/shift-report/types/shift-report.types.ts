export interface ShiftSummary {
  date: string;
  checkedIn: number;
  checkedOut: number;
  tasksCompleted: number;
  // TODO: confirm with backend
}

export type ShiftStatus = 'Active' | 'Ended';

export interface ShiftEvent {
  id: string;
  title: string;
  description?: string;
  time?: string;
}

export interface PersonalShift {
  shiftId: string;
  staffName: string;
  staffRole: string;
  status: ShiftStatus;
  startedAt?: string;
  endedAt?: string;
  tasksCompleted: number;
  paymentsHandled: number;
  totalCollected: number;
  notes?: string;
  events: ShiftEvent[];
}


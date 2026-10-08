export interface Shift {
  id: string;
  startAt?: string; // TODO: confirm with backend
  endAt?: string; // TODO: confirm with backend
  notes?: string; // TODO: confirm with backend
}

export interface ShiftSummary {
  shiftId: string;
  tasks: number;
  openItems: number;
  // TODO: confirm with backend
}

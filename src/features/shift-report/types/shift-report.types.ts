export interface ShiftSummary {
  date: string;
  checkedIn: number;
  checkedOut: number;
  tasksCompleted: number;
  staffName?: string;
  staffRole?: string;
  shiftName?: string;
  startedAt?: string;
  endedAt?: string;
  performanceScore?: number;
  totalCollected?: number;
  cashCollected?: number;
  cardCollected?: number;
  transferCollected?: number;
  housekeepingTasks?: number;
  maintenanceTasks?: number;
  reservations?: number;
  guestRequests?: number;
  notes?: string;
  events?: ShiftReportEvent[];
  occupancyRate?: number;
  handoverStatus?: HandoverStatus;
  completedTaskLogs?: CompletedTaskLog[];
  roomStatus?: RoomStatusSummary;
  salesBreakdown?: ShiftSalesRow[];
}

export interface ShiftReportEvent {
  id: string;
  title: string;
  description?: string;
  time?: string;
}

export interface CompletedTaskLog {
  id: string;
  type: 'housekeeping' | 'maintenance';
  room: string;
  description: string;
  completedAt?: string;
}

export type HandoverStatus = 'handed_over' | 'pending';

export interface RoomStatusSummary {
  total: number;
  occupied: number;
  available: number;
  reserved: number;
  cleaning: number;
  maintenance: number;
}

export interface ShiftSalesRow {
  id: string;
  category: 'cash' | 'card' | 'transfer';
  quantity?: number;
  amount: number;
}

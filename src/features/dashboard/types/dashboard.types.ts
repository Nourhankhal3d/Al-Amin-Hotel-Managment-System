export interface DashboardSummary {
  roomsOccupied: number;
  roomsAvailable: number;
  housekeepingTasks: number;
  maintenanceRequests: number;
  paymentsToday: number;
  // TODO: confirm with backend
  upcomingCheckins?: string[];
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  task: string;
  assignedTo?: string; // TODO: confirm with backend
  status: string;
  dueAt?: string; // TODO: confirm with backend
}

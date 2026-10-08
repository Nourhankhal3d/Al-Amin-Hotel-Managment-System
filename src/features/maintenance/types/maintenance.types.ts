export interface MaintenanceRequest {
  id: string;
  roomNumber: string;
  title: string;
  description?: string; // TODO: confirm with backend
  status: string;
  priority?: string; // TODO: confirm with backend
  createdAt?: string; // TODO: confirm with backend
}

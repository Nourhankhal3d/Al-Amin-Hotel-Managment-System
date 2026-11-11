// Manager API Contract v1.2 has no manager maintenance endpoints yet (only /dashboard/issues), so the tickets
// are a proposal for the backend: same names as the staff /maintenance-issues API (issue_id, problem, notes),
// plus what the design (images 2 and 2.2) needs. The technicians and rooms lists are real
// (GET /manager/staff?staff_type=TECHNICIAN, GET /manager/rooms).

export type MaintenancePriority = 'RUSH' | 'HIGH' | 'NORMAL' | 'LOW';
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

/** Ticket as the API returns it (snake_case) */
export interface ApiMaintenanceTicket {
  issue_id: string;
  room_id: string;
  room_number: string;
  /** Short title, e.g. "المكيّف لا يبرّد" */
  problem: string;
  /** Longer description */
  notes: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assigned_to_staff_id: string | null;
  technician_name: string | null;
  created_at: string;
  updated_at?: string;
  expected_resolution_at?: string | null;
  resolved_at?: string | null;
}

/** GET /manager/staff?staff_type=TECHNICIAN item (only the fields this page reads) */
export interface ApiStaffMember {
  staff_id: string;
  full_name: string;
}

/** GET /manager/rooms item (only the fields this page reads) */
export interface ApiRoom {
  room_id: string;
  room_number: string;
  current_guest_name?: string | null;
}

export interface ApiList<T> {
  data: T[];
}

/** Ticket as the page uses it */
export interface MaintenanceTicket {
  id: string;
  /** Short label for people, e.g. MT-0128 (the API id is an ObjectId) */
  code: string;
  roomId: string;
  roomNumber: string;
  issue: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  technicianId: string | null;
  technicianName: string | null;
  reportedAt: string;
  updatedAt: string;
  expectedResolutionAt: string | null;
  resolvedAt: string | null;
}

export interface TechnicianOption {
  id: string;
  name: string;
}

export interface MaintenanceRoomOption {
  roomId: string;
  roomNumber: string;
  guestName: string | null;
}

/** PATCH body: only the fields that changed */
export interface MaintenanceTicketUpdate {
  assigned_to_staff_id?: string | null;
  status?: MaintenanceStatus;
  expected_resolution_at?: string | null;
}

/** POST body: the receptionist's POST /maintenance-issues fields, plus the technician when one is picked */
export interface MaintenanceTicketCreate {
  room_id: string;
  problem: string;
  priority: MaintenancePriority;
  assigned_to_staff_id?: string;
  notes?: string;
}

export interface MaintenanceFilters {
  q: string;
  room: string;
  priority: MaintenancePriority | '';
  status: MaintenanceStatus | '';
  technician: string;
  page: number;
}

export type MaintenanceFilterName = 'room' | 'priority' | 'status' | 'technician';

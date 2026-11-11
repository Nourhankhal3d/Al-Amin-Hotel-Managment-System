import { request } from '../../../core/api/apiClient';
import type {
  ApiList,
  ApiMaintenanceTicket,
  ApiRoom,
  ApiStaffMember,
  MaintenanceRoomOption,
  MaintenanceTicket,
  MaintenanceTicketCreate,
  MaintenanceTicketUpdate,
  TechnicianOption,
} from '../types/manager-maintenance.types';

// Not in Manager API Contract v1.2 yet: same naming style as the contract and the staff /maintenance-issues API.
// TODO: the backend adds these endpoints (paths, fields and enums below are the proposal).
const BASE = '/manager/maintenance-issues';

/** The API sends an issue or { data: issue }; accept both */
function unwrap<T>(response: T | { data: T }): T {
  return response && typeof response === 'object' && 'data' in response ? (response as { data: T }).data : response as T;
}

export function toMaintenanceTicket(api: ApiMaintenanceTicket): MaintenanceTicket {
  const id = String(api.issue_id);
  return {
    id,
    code: `MT-${id.slice(-4).toUpperCase()}`,
    roomId: String(api.room_id ?? ''),
    roomNumber: String(api.room_number ?? ''),
    issue: api.problem ?? '',
    description: api.notes ?? '',
    priority: api.priority ?? 'NORMAL',
    status: api.status ?? 'OPEN',
    technicianId: api.assigned_to_staff_id ?? null,
    technicianName: api.technician_name ?? null,
    reportedAt: api.created_at,
    updatedAt: api.updated_at ?? api.created_at,
    expectedResolutionAt: api.expected_resolution_at ?? null,
    resolvedAt: api.resolved_at ?? null,
  };
}

export async function getMaintenanceTickets(): Promise<MaintenanceTicket[]> {
  const response = await request<{ data: ApiMaintenanceTicket[] }>(BASE, { params: { limit: 100 } });
  return (response.data ?? []).map(toMaintenanceTicket);
}

/** GET /manager/staff (contract) — active technicians only */
export async function getTechnicians(): Promise<TechnicianOption[]> {
  const response = await request<ApiList<ApiStaffMember>>('/manager/staff', {
    params: { staff_type: 'TECHNICIAN', is_active: 'true', limit: 100 },
  });
  return (response.data ?? []).map((staff) => ({ id: String(staff.staff_id), name: staff.full_name }));
}

/** GET /manager/rooms (contract) — every room in one call (200 is the largest page the API allows) */
export async function getRooms(): Promise<MaintenanceRoomOption[]> {
  const response = await request<ApiList<ApiRoom>>('/manager/rooms', { params: { limit: 200 } });
  return (response.data ?? []).map((room) => ({
    roomId: String(room.room_id),
    roomNumber: String(room.room_number),
    guestName: room.current_guest_name ?? null,
  }));
}

export async function updateMaintenanceTicket(id: string, body: MaintenanceTicketUpdate): Promise<MaintenanceTicket> {
  const response = await request<ApiMaintenanceTicket | { data: ApiMaintenanceTicket }>(`${BASE}/${encodeURIComponent(id)}`, { method: 'PATCH', body });
  return toMaintenanceTicket(unwrap(response));
}

export async function createMaintenanceTicket(body: MaintenanceTicketCreate): Promise<MaintenanceTicket> {
  const response = await request<ApiMaintenanceTicket | { data: ApiMaintenanceTicket }>(BASE, { method: 'POST', body });
  return toMaintenanceTicket(unwrap(response));
}

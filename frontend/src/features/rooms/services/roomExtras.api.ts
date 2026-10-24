import { request } from '../../../core/api/apiClient';
import type { Paginated } from '../../../core/api/api.types';

export type ExtraPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface RoomPaymentInfo {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  notes: string | null;
}

export interface RoomReservationInfo {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  total: number;
  paid: number;
  remaining: number;
  guestName: string | null;
  guestPhone: string | null;
  guestIdNumber: string | null;
  payments: RoomPaymentInfo[];
}

export interface RoomCleaningInfo {
  id: string;
  cleanerName: string | null;
  priority: ExtraPriority;
  status: 'pending' | 'done';
  assignedDate: string;
}

export interface RoomMaintenanceInfo {
  id: string;
  problem: string;
  priority: ExtraPriority;
  status: 'open' | 'in_progress' | 'resolved';
  createdDate: string;
}

export interface RoomExtras {
  reservation: RoomReservationInfo | null;
  cleaning: RoomCleaningInfo[];
  maintenance: RoomMaintenanceInfo[];
}

interface ApiReservationListItem {
  reservation_id: string;
  status: string;
}

interface ApiPayment {
  payment_id: string;
  amount: number;
  payment_method: string;
  payment_datetime: string;
  notes: string | null;
}

interface ApiReservationDetail {
  reservation_id: string;
  status: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  guest: { name: string; phone: string; id_number: string } | null;
  payments: ApiPayment[];
}

interface ApiCleaningTask {
  task_id: string;
  priority: ExtraPriority;
  status: 'pending' | 'done';
  cleaner_name: string | null;
  assigned_date: string;
}

interface ApiMaintenanceIssue {
  issue_id: string;
  problem: string;
  priority: ExtraPriority;
  status: 'open' | 'in_progress' | 'resolved';
  created_date: string;
}

const RESERVATION_LIST_LIMIT = 20;
const SECTION_LIMIT = 3;

function mapReservation(detail: ApiReservationDetail): RoomReservationInfo {
  return {
    id: detail.reservation_id,
    status: detail.status,
    checkIn: detail.check_in,
    checkOut: detail.check_out,
    total: detail.total_amount,
    paid: detail.paid_amount,
    remaining: detail.remaining_amount,
    guestName: detail.guest?.name ?? null,
    guestPhone: detail.guest?.phone ?? null,
    guestIdNumber: detail.guest?.id_number ?? null,
    payments: (detail.payments ?? []).map((payment) => ({
      id: payment.payment_id,
      amount: payment.amount,
      method: payment.payment_method,
      paidAt: payment.payment_datetime,
      notes: payment.notes,
    })),
  };
}

// The guest who is in the room now (checked_in), otherwise the confirmed booking.
async function getActiveReservation(roomId: string): Promise<RoomReservationInfo | null> {
  const list = await request<Paginated<ApiReservationListItem>>('/reservations', {
    params: { room_id: roomId, limit: RESERVATION_LIST_LIMIT },
  });
  const active =
    list.data.find((item) => item.status === 'checked_in') ??
    list.data.find((item) => item.status === 'confirmed');
  if (!active) return null;

  const detail = await request<ApiReservationDetail>(`/reservations/${active.reservation_id}`);
  return mapReservation(detail);
}

async function getRoomCleaning(roomId: string): Promise<RoomCleaningInfo[]> {
  const response = await request<Paginated<ApiCleaningTask>>('/cleaning-tasks', {
    params: { room_id: roomId, limit: SECTION_LIMIT },
  });
  return response.data.map((task) => ({
    id: task.task_id,
    cleanerName: task.cleaner_name,
    priority: task.priority,
    status: task.status,
    assignedDate: task.assigned_date,
  }));
}

async function getRoomMaintenance(roomId: string): Promise<RoomMaintenanceInfo[]> {
  const response = await request<Paginated<ApiMaintenanceIssue>>('/maintenance-issues', {
    params: { room_id: roomId, limit: SECTION_LIMIT },
  });
  return response.data.map((issue) => ({
    id: issue.issue_id,
    problem: issue.problem,
    priority: issue.priority,
    status: issue.status,
    createdDate: issue.created_date,
  }));
}

export async function getRoomExtras(roomId: string): Promise<RoomExtras> {
  const [reservation, cleaning, maintenance] = await Promise.all([
    getActiveReservation(roomId),
    getRoomCleaning(roomId),
    getRoomMaintenance(roomId),
  ]);
  return { reservation, cleaning, maintenance };
}
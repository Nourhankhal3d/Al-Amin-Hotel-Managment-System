import { request } from '../../../core/api/apiClient';
import type { Paginated } from '../../../core/api/api.types';
import { REPORTS_FETCH_LIMIT, STAFF_FETCH_LIMIT } from '../constants/shifts.constants';
import type {
  Assignee,
  ReviewStatus,
  ShiftActivity,
  ShiftEntry,
  ShiftHandover,
  ShiftOverview,
  ShiftReport,
  ShiftReportDetail,
  ShiftStatus,
  ShiftType,
} from '../types/shift.types';

// Manager API Contract v1.1. Served by the mocks until the backend ships (VITE_USE_MOCKS=true).

export async function getShiftsOverview(businessDate: string): Promise<ShiftOverview[]> {
  const response = await request<unknown>('/manager/shifts/overview', { params: { business_date: businessDate } });
  const body = response as Record<string, unknown> | unknown[] | null | undefined;

  let rawCards: Record<string, unknown>[] = [];
  if (Array.isArray(body)) {
    rawCards = body as Record<string, unknown>[];
  } else if (body && typeof body === 'object') {
    const data = (body as { data?: unknown }).data;
    if (Array.isArray(data)) {
      rawCards = data as Record<string, unknown>[];
    } else if (data && typeof data === 'object') {
      const cards = (data as { cards?: unknown }).cards;
      if (Array.isArray(cards)) {
        rawCards = cards as Record<string, unknown>[];
      }
    } else if (Array.isArray((body as { cards?: unknown }).cards)) {
      rawCards = (body as { cards: Record<string, unknown>[] }).cards;
    }
  }

  return rawCards.map((card) => {
    const rawType = String(card.shift_type || 'MORNING').toUpperCase();
    const shiftType: ShiftType = (['MORNING', 'EVENING', 'NIGHT'].includes(rawType)
      ? rawType
      : 'MORNING') as ShiftType;

    const startTime = String(card.start_time || card.start_at || '');
    const endTime = String(card.end_time || card.end_at || '');

    const rawStatus = typeof card.status === 'string' ? card.status.toUpperCase() : '';
    let status: ShiftOverview['status'] = 'SCHEDULED';
    if (['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(rawStatus)) {
      status = rawStatus as ShiftOverview['status'];
    } else {
      const counts = card.counts as { active?: number; completed?: number; scheduled?: number } | undefined;
      if (counts?.active && counts.active > 0) {
        status = 'ACTIVE';
      } else {
        const now = Date.now();
        const start = startTime ? new Date(startTime).getTime() : NaN;
        const end = endTime ? new Date(endTime).getTime() : NaN;
        if (!Number.isNaN(start) && !Number.isNaN(end)) {
          if (now >= start && now < end) {
            status = 'ACTIVE';
          } else if (now >= end) {
            status = 'COMPLETED';
          } else {
            status = 'SCHEDULED';
          }
        } else if (counts?.completed && counts.completed > 0 && !counts.scheduled) {
          status = 'COMPLETED';
        }
      }
    }

    let leadStaff: ShiftOverview['staff'] = null;
    const rawStaff = card.staff;
    if (Array.isArray(rawStaff)) {
      const staffList = rawStaff as Record<string, unknown>[];
      const receptionist = staffList.find((s) => {
        const dep = String(s.department || '').toLowerCase();
        return dep === 'reception' || dep === 'front_desk';
      }) ?? staffList[0];

      if (receptionist) {
        leadStaff = {
          staff_id: String(receptionist.staff_id || receptionist.id || ''),
          full_name: String(receptionist.full_name || receptionist.staff_name || receptionist.name || ''),
        };
      }
    } else if (rawStaff && typeof rawStaff === 'object') {
      const staffObj = rawStaff as Record<string, unknown>;
      leadStaff = {
        staff_id: String(staffObj.staff_id || staffObj.id || ''),
        full_name: String(staffObj.full_name || staffObj.staff_name || staffObj.name || ''),
      };
    }

    const counts = card.counts as { active?: number; completed?: number; scheduled?: number } | undefined;
    const teamCount = typeof card.team_count === 'number'
      ? card.team_count
      : counts
        ? (counts.scheduled || 0) + (counts.active || 0) + (counts.completed || 0)
        : Array.isArray(rawStaff)
          ? rawStaff.length
          : leadStaff ? 1 : 0;

    let report: ShiftOverview['report'] = null;
    if (card.report && typeof card.report === 'object') {
      const rep = card.report as { report_id?: string; review_status?: ReviewStatus };
      if (rep.report_id && rep.review_status) {
        report = { report_id: String(rep.report_id), review_status: rep.review_status };
      }
    }

    return {
      shift_type: shiftType,
      shift_id: card.shift_id ? String(card.shift_id) : null,
      status,
      start_time: startTime,
      end_time: endTime,
      staff: leadStaff,
      team_count: teamCount,
      rooms_handled: typeof card.rooms_handled === 'number' ? card.rooms_handled : 0,
      gross_revenue: typeof card.gross_revenue === 'number' ? card.gross_revenue : 0,
      cleaning_tasks: typeof card.cleaning_tasks === 'number' ? card.cleaning_tasks : 0,
      maintenance_requests: typeof card.maintenance_requests === 'number' ? card.maintenance_requests : 0,
      pending_items: typeof card.pending_items === 'number' ? card.pending_items : 0,
      report,
    };
  });
}

export async function getShiftTeam(businessDate: string, shiftType: ShiftType): Promise<ShiftEntry[]> {
  const response = await request<Paginated<any>>('/manager/shifts', {
    params: { business_date: businessDate, shift_type: shiftType, page: 1, limit: STAFF_FETCH_LIMIT },
  });
  const list = Array.isArray(response?.data) ? response.data : [];
  return list.map((item: any) => ({
    shift_id: String(item.shift_id || item.id || ''),
    business_date: String(item.business_date || businessDate),
    staff_id: String(item.staff_id || ''),
    staff_name: String(item.staff_name || item.full_name || ''),
    shift_type: (item.shift_type || shiftType).toUpperCase() as ShiftType,
    status: (item.status || 'SCHEDULED').toUpperCase() as ShiftStatus,
    start_time: String(item.start_time || item.start_at || ''),
    end_time: String(item.end_time || item.end_at || ''),
  }));
}

export async function cancelShift(shiftId: string): Promise<void> {
  await request(`/manager/shifts/${shiftId}`, { method: 'DELETE' });
}

export async function getShiftReports(): Promise<ShiftReport[]> {
  const response = await request<Paginated<ShiftReport>>('/shift-reports', { params: { page: 1, limit: REPORTS_FETCH_LIMIT } });
  return response.data;
}

export async function getShiftReport(reportId: string): Promise<ShiftReportDetail> {
  const response = await request<{ data: ShiftReportDetail }>(`/shift-reports/${reportId}`);
  return response.data;
}

export async function getShiftHandover(reportId: string): Promise<ShiftHandover> {
  const response = await request<{ data: ShiftHandover }>(`/shift-reports/${reportId}/handover`);
  return response.data;
}

export async function getShiftActivities(reportId: string): Promise<ShiftActivity[]> {
  const response = await request<{ data: ShiftActivity[] }>(`/shift-reports/${reportId}/activities`);
  return response.data;
}

export async function reviewShiftReport(reportId: string, reviewStatus: Exclude<ReviewStatus, 'PENDING_REVIEW'>, comment: string): Promise<ShiftReport> {
  const response = await request<{ data: ShiftReport }>(`/shift-reports/${reportId}/review`, {
    method: 'PATCH',
    body: { review_status: reviewStatus, ...(comment ? { manager_comment: comment } : {}) },
  });
  return response.data;
}

export async function getAssignees(): Promise<Assignee[]> {
  const response = await request<Paginated<any>>('/manager/staff', {
    params: { include: 'today_shift', is_active: true, page: 1, limit: STAFF_FETCH_LIMIT },
  });
  const list = Array.isArray(response?.data) ? response.data : [];
  return list.map((item: any) => ({
    staff_id: String(item.staff_id || item.id || ''),
    full_name: String(item.full_name || item.staff_name || item.name || ''),
    staff_type: (item.staff_type || 'RECEPTIONIST').toUpperCase(),
    is_active: Boolean(item.is_active),
    today_shift: item.today_shift ? {
      shift_id: String(item.today_shift.shift_id || item.today_shift.id || ''),
      shift_type: (item.today_shift.shift_type || 'MORNING').toUpperCase(),
      status: (item.today_shift.status || 'SCHEDULED').toUpperCase(),
    } : null,
  }));
}

/**
 * Moves an employee to another shift today: a new shift when they have none,
 * otherwise their SCHEDULED shift is changed (the server refuses one that already started).
 */
export async function assignShift(assignee: Assignee, businessDate: string, shiftType: ShiftType): Promise<void> {
  if (!assignee.today_shift) {
    await request('/manager/shifts', { method: 'POST', body: { staff_id: assignee.staff_id, business_date: businessDate, shift_type: shiftType } });
    return;
  }
  await request(`/manager/shifts/${assignee.today_shift.shift_id}`, { method: 'PATCH', body: { shift_type: shiftType } });
}

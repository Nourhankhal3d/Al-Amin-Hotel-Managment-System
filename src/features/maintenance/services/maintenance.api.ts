import { MT_FETCH_LIMIT } from '../constants/maintenance.constants';
import type { MaintenanceIssueCreate, MaintenanceIssueUpdate, MaintenanceRequest } from '../types/maintenance.types';

// TEMP: in-memory mock that behaves like the API (same shape, same rules), until the data-layer merge.
// TODO(merge): replace the three function bodies with core/api `request` calls:
//   getMaintenanceRequests   -> request<Paginated<MaintenanceRequest>>('/maintenance-issues', { params: { page: 1, limit: MT_FETCH_LIMIT } }) then `.data`
//   createMaintenanceRequest -> request<MaintenanceRequest>('/maintenance-issues', { method: 'POST', body })
//   updateMaintenanceRequest -> request<MaintenanceRequest>(`/maintenance-issues/${issueId}`, { method: 'PATCH', body })

const SHIFT_ID = 41;
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function issue(
  issue_id: number,
  room_id: number,
  problem: string,
  priority: MaintenanceRequest['priority'],
  status: MaintenanceRequest['status'],
  createdMinutesAgo: number,
  extra: { resolvedMinutesAgo?: number; notes?: string } = {},
): MaintenanceRequest {
  return {
    issue_id,
    room_id,
    // Sample text typed by a receptionist, shown as typed
    problem,
    priority,
    status,
    created_date: minutesAgo(createdMinutesAgo),
    shift_id: SHIFT_ID,
    staff_id: 1,
    notes: extra.notes ?? null,
    resolved_date: extra.resolvedMinutesAgo === undefined ? null : minutesAgo(extra.resolvedMinutesAgo),
  };
}

let requests: MaintenanceRequest[] = [
  issue(128, 112, 'المكيّف لا يبرّد', 'urgent', 'in_progress', 120, {
    notes: 'المكيّف لا يبرّد في غرفة الضيف. تم إبلاغ الفريق الفني مع طلب الفحص في أقرب وقت.',
  }),
  issue(127, 305, 'ضعف ضغط المياه', 'high', 'open', 150),
  issue(126, 202, 'إضاءة المرآة', 'medium', 'resolved', 140, { resolvedMinutesAgo: 98 }),
  issue(125, 206, 'قفل النافذة', 'low', 'in_progress', 165),
  issue(124, 308, 'تسريب من وحدة التكييف', 'urgent', 'open', 30),
  issue(123, 101, 'انسداد في الحوض', 'medium', 'open', 200),
  issue(122, 207, 'مقبس كهرباء لا يعمل', 'low', 'resolved', 230, { resolvedMinutesAgo: 195 }),
  issue(121, 210, 'باب الخزانة مكسور', 'low', 'resolved', 260, { resolvedMinutesAgo: 215 }),
  issue(120, 312, 'تسرّب في الحمّام', 'high', 'resolved', 1500, { resolvedMinutesAgo: 1450 }),
  issue(119, 102, 'صوت مرتفع من المكيّف', 'medium', 'resolved', 1600, { resolvedMinutesAgo: 1560 }),
  issue(118, 207, 'كرسي مكسور', 'low', 'resolved', 1700, { resolvedMinutesAgo: 1655 }),
  issue(117, 112, 'مصباح لا يعمل', 'low', 'open', 1800),
];

let nextId = 1000;
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const copy = (item: MaintenanceRequest): MaintenanceRequest => ({ ...item });

export async function getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  await wait();
  return requests.slice(0, MT_FETCH_LIMIT).map(copy);
}

export async function createMaintenanceRequest(body: MaintenanceIssueCreate): Promise<MaintenanceRequest> {
  await wait();
  const created = issue(nextId++, body.room_id, body.problem, body.priority, 'open', 0, { notes: body.notes });
  requests = [created, ...requests];
  return copy(created);
}

export async function updateMaintenanceRequest(issueId: number, body: MaintenanceIssueUpdate): Promise<MaintenanceRequest> {
  await wait();
  const current = requests.find((item) => item.issue_id === issueId);
  if (!current) throw new Error(`Maintenance issue ${issueId} not found`);
  // Same rule as the API: a resolved issue cannot be reopened
  if (current.status === 'resolved' && body.status !== undefined) throw new Error('CONFLICT');
  const updated: MaintenanceRequest = {
    ...current,
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.status === 'resolved' ? { resolved_date: new Date().toISOString() } : {}),
  };
  requests = requests.map((item) => (item.issue_id === issueId ? updated : item));
  return copy(updated);
}

import { http, HttpResponse } from 'msw';
import { findMockRoom, mockHousekeepers, mockRooms } from './managerLookups.handler';

// Mock for the manager housekeeping page (Sprint 3).
// Same shape and rules as the real API: Manager API Contract v1.2, section 11.3.
// POST (new task) is not in the contract yet: the body mirrors the receptionist's POST /cleaning-tasks.
const API = '/api/v1';

type Priority = 'RUSH' | 'HIGH' | 'NORMAL' | 'LOW';
type Status = 'PENDING' | 'COMPLETED';

interface MockTask {
  task_id: string;
  room_id: string;
  room_number: string;
  cleaner_name: string | null;
  assigned_to_staff_id: string | null;
  priority: Priority;
  status: Status;
  notes: string;
  created_at: string;
}

const PRIORITIES: Priority[] = ['RUSH', 'HIGH', 'NORMAL', 'LOW'];
const PRIORITY_RANK: Record<Priority, number> = { LOW: 1, NORMAL: 2, HIGH: 3, RUSH: 4 };
const NOTES_MAX_LENGTH = 500;
const CLEANER_MAX_LENGTH = 60;

/**
 * The design's clock reads 12:42, so a task logged at "11:18" happened 84 minutes before now.
 * Times are kept relative to now, so the list never shows a task in the future.
 */
const DESIGN_NOW_MINUTES = 12 * 60 + 42;
function todayAt(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(Date.now() - (DESIGN_NOW_MINUTES - (hours * 60 + minutes)) * 60_000).toISOString();
}

let nextId = 1;
const newTaskId = () => `6719b4a1f2e8c90012ab${String(5000 + nextId++)}`;

function task(roomNumber: string, cleaner: number | null, priority: Priority, status: Status, time: string, notes = ''): MockTask {
  const room = mockRooms.find((item) => item.room_number === roomNumber);
  const staff = cleaner === null ? null : mockHousekeepers[cleaner];
  return {
    task_id: newTaskId(),
    room_id: room?.room_id ?? '',
    room_number: roomNumber,
    cleaner_name: staff?.full_name ?? null,
    assigned_to_staff_id: staff?.staff_id ?? null,
    priority,
    status,
    notes,
    created_at: todayAt(time),
  };
}

// Seed: 25 tasks today = 11 pending + 14 completed, 4 of them high priority (high + rush)
const tasks: MockTask[] = [
  task('207', 0, 'HIGH', 'PENDING', '11:18'),
  task('305', 1, 'RUSH', 'PENDING', '11:05', 'يرجى تجهيز الغرفة بالكامل والتأكد من المناشف ومستلزمات الضيافة.'),
  task('101', 2, 'NORMAL', 'COMPLETED', '10:30'),
  task('312', 0, 'LOW', 'PENDING', '10:12', 'الضيف طلب مناشف إضافية.'),
  task('112', 1, 'HIGH', 'COMPLETED', '09:45'),
  task('208', 2, 'NORMAL', 'PENDING', '09:40'),
  task('110', 0, 'LOW', 'PENDING', '09:32'),
  task('302', 1, 'NORMAL', 'PENDING', '09:25'),
  task('203', 2, 'NORMAL', 'COMPLETED', '09:20'),
  task('105', 0, 'LOW', 'COMPLETED', '09:12'),
  task('211', null, 'HIGH', 'PENDING', '09:05'),
  task('306', 1, 'NORMAL', 'COMPLETED', '09:00'),
  task('104', 2, 'LOW', 'COMPLETED', '08:54'),
  task('210', 0, 'NORMAL', 'PENDING', '08:47'),
  task('309', 1, 'LOW', 'COMPLETED', '08:40'),
  task('107', 2, 'NORMAL', 'COMPLETED', '08:33'),
  task('205', 0, 'LOW', 'PENDING', '08:27'),
  task('301', 1, 'NORMAL', 'COMPLETED', '08:20'),
  task('202', 2, 'NORMAL', 'COMPLETED', '08:14'),
  task('108', 0, 'LOW', 'PENDING', '08:08'),
  task('304', 1, 'NORMAL', 'PENDING', '08:02'),
  task('209', 2, 'LOW', 'COMPLETED', '07:55'),
  task('103', 0, 'NORMAL', 'COMPLETED', '07:48'),
  task('310', 1, 'LOW', 'COMPLETED', '07:40'),
  task('204', 2, 'NORMAL', 'COMPLETED', '07:30'),
];

function errorResponse(code: string, message: string, status: number, field?: string) {
  return HttpResponse.json({ error: { code, message, ...(field ? { details: { field } } : {}) } }, { status });
}

const housekeeperById = (id: unknown) => mockHousekeepers.find((staff) => staff.staff_id === id);
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const managerHousekeepingHandlers = [
  http.get(`${API}/manager/housekeeping-tasks`, ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')?.toUpperCase();
    const data = status === 'PENDING' || status === 'COMPLETED' ? tasks.filter((item) => item.status === status) : tasks;
    return HttpResponse.json({ data, meta: { page: 1, limit: 100, total: data.length, total_pages: 1 } });
  }),

  // Not in the contract yet (proposal): same body as the receptionist's POST /cleaning-tasks, plus the staff id
  http.post(`${API}/manager/housekeeping-tasks`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const room = findMockRoom(body.room_id);
    if (!room) return errorResponse('VALIDATION_ERROR', 'Room not found', 400, 'room_id');
    if (!PRIORITIES.includes(body.priority as Priority)) return errorResponse('VALIDATION_ERROR', 'Invalid priority', 400, 'priority');
    const staff = body.assigned_to_staff_id ? housekeeperById(body.assigned_to_staff_id) : null;
    if (body.assigned_to_staff_id && !staff) {
      return errorResponse('VALIDATION_ERROR', 'Assigned staff must have housekeeper role', 400, 'assigned_to_staff_id');
    }
    const cleanerName = text(body.cleaner_name) || staff?.full_name || '';
    if (cleanerName.length > CLEANER_MAX_LENGTH) return errorResponse('VALIDATION_ERROR', 'cleaner_name is too long', 400, 'cleaner_name');
    if (text(body.notes).length > NOTES_MAX_LENGTH) return errorResponse('VALIDATION_ERROR', 'notes is too long', 400, 'notes');
    const created: MockTask = {
      task_id: newTaskId(),
      room_id: room.room_id,
      room_number: room.room_number,
      cleaner_name: cleanerName || null,
      assigned_to_staff_id: staff?.staff_id ?? null,
      priority: body.priority as Priority,
      status: 'PENDING',
      notes: text(body.notes),
      created_at: new Date().toISOString(),
    };
    tasks.unshift(created);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),

  // Contract: cleaner_name, assigned_to_staff_id, priority (it can only go up); a completed task cannot be edited
  http.patch(`${API}/manager/housekeeping-tasks/:id/assign`, async ({ params, request }) => {
    const found = tasks.find((item) => item.task_id === params.id);
    if (!found) return errorResponse('NOT_FOUND', 'Housekeeping task not found', 404);
    if (found.status === 'COMPLETED') {
      return errorResponse('INVALID_STATUS_TRANSITION', 'Cannot reassign or edit a completed cleaning task', 422);
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const updates: Partial<MockTask> = {};
    if (body.assigned_to_staff_id !== undefined) {
      if (body.assigned_to_staff_id === null) {
        updates.assigned_to_staff_id = null;
      } else {
        const staff = housekeeperById(body.assigned_to_staff_id);
        if (!staff) return errorResponse('VALIDATION_ERROR', 'Assigned staff must have housekeeper role', 400, 'assigned_to_staff_id');
        updates.assigned_to_staff_id = staff.staff_id;
        if (!body.cleaner_name) updates.cleaner_name = staff.full_name;
      }
    }
    if (body.cleaner_name !== undefined) updates.cleaner_name = text(body.cleaner_name) || null;
    if (body.priority !== undefined) {
      if (!PRIORITIES.includes(body.priority as Priority)) {
        return errorResponse('VALIDATION_ERROR', `Invalid priority: ${String(body.priority)}`, 400, 'priority');
      }
      if (PRIORITY_RANK[body.priority as Priority] < PRIORITY_RANK[found.priority]) {
        return errorResponse('INVALID_STATUS_TRANSITION', 'Cannot lower task priority', 422);
      }
      updates.priority = body.priority as Priority;
    }
    if (Object.keys(updates).length === 0) return errorResponse('VALIDATION_ERROR', 'At least one field is required to update', 400);
    Object.assign(found, updates);
    return HttpResponse.json({ data: found });
  }),
];

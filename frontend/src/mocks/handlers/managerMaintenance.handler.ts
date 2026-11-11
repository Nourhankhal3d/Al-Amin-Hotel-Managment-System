import { http, HttpResponse } from 'msw';
import { findMockRoom, mockRooms, mockTechnicians } from './managerLookups.handler';

// Mock for the manager maintenance page (Sprint 3).
// Not in Manager API Contract v1.2 yet (proposal for the backend): names follow the contract style and the staff
// /maintenance-issues API. The technicians and rooms come from the real lists (see managerLookups.handler.ts).
const API = '/api/v1';

type Priority = 'RUSH' | 'HIGH' | 'NORMAL' | 'LOW';
type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

interface MockTicket {
  issue_id: string;
  room_id: string;
  room_number: string;
  problem: string;
  notes: string | null;
  priority: Priority;
  status: Status;
  assigned_to_staff_id: string | null;
  technician_name: string | null;
  created_at: string;
  updated_at: string;
  expected_resolution_at: string | null;
  resolved_at: string | null;
}

const PRIORITIES: Priority[] = ['RUSH', 'HIGH', 'NORMAL', 'LOW'];
const STATUSES: Status[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

const NOTES_MAX_LENGTH = 500;
const PROBLEM_MAX_LENGTH = 120;

/** Minutes before now, so the list never shows a ticket in the future */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

interface Seed {
  code: number;
  room: string;
  issue: string;
  priority: Priority;
  status: Status;
  technician: number | null;
  /** minutes before now */
  reported: number;
  updated: number;
  /** minutes the fix took (resolved tickets) */
  took?: number;
  /** minutes from now (negative = already passed) */
  expected?: number;
  description?: string;
}

// Seed: 12 tickets = 4 pending + 2 in progress + 6 resolved, 2 critical, 8 reported today, 42 minutes average fix
const seeds: Seed[] = [
  { code: 128, room: '112', issue: 'المكيّف لا يبرّد', priority: 'RUSH', status: 'IN_PROGRESS', technician: 0, reported: 106, updated: 8, expected: 3,
    description: 'المكيّف لا يبرّد في غرفة الضيف. تم إبلاغ الفريق الفني مع طلب الفحص في أقرب وقت.' },
  { code: 127, room: '305', issue: 'ضعف ضغط المياه', priority: 'HIGH', status: 'OPEN', technician: null, reported: 142, updated: 32,
    description: 'الضيف أبلغ عن ضعف ضغط المياه في الدش.' },
  { code: 126, room: '202', issue: 'إضاءة المرآة', priority: 'NORMAL', status: 'RESOLVED', technician: 1, reported: 177, updated: 132, took: 45 },
  { code: 125, room: '306', issue: 'قفل النافذة', priority: 'LOW', status: 'IN_PROGRESS', technician: 1, reported: 210, updated: 60, expected: 40 },
  { code: 124, room: '101', issue: 'تسرب مياه في الحمام', priority: 'RUSH', status: 'OPEN', technician: null, reported: 225, updated: 225,
    description: 'تسرب مياه أسفل الحوض، تم وضع فوطة مؤقتًا.' },
  { code: 123, room: '208', issue: 'الريموت لا يعمل', priority: 'LOW', status: 'RESOLVED', technician: 2, reported: 240, updated: 210, took: 30 },
  { code: 122, room: '210', issue: 'صوت مرتفع من الثلاجة', priority: 'NORMAL', status: 'OPEN', technician: 2, reported: 255, updated: 250 },
  { code: 121, room: '104', issue: 'لمبة السقف محترقة', priority: 'NORMAL', status: 'RESOLVED', technician: 0, reported: 270, updated: 220, took: 50 },
  { code: 120, room: '309', issue: 'باب الدولاب لا يغلق', priority: 'LOW', status: 'OPEN', technician: null, reported: 1500, updated: 1500 },
  { code: 119, room: '203', issue: 'تسريب من السيفون', priority: 'HIGH', status: 'RESOLVED', technician: 1, reported: 1620, updated: 1585, took: 35 },
  { code: 118, room: '107', issue: 'مقبس الكهرباء لا يعمل', priority: 'NORMAL', status: 'RESOLVED', technician: 2, reported: 2900, updated: 2860, took: 40 },
  { code: 117, room: '301', issue: 'شاشة التلفاز لا تعمل', priority: 'HIGH', status: 'RESOLVED', technician: 0, reported: 3020, updated: 2968, took: 52 },
];

/** ObjectId-like id that ends with the ticket number, so the page shows MT-0128 */
const ticketId = (code: number) => `6719b4a1f2e8c90012ab${String(code).padStart(4, '0')}`;

function toTicket(seed: Seed): MockTicket {
  const room = mockRooms.find((item) => item.room_number === seed.room);
  const staff = seed.technician === null ? null : mockTechnicians[seed.technician];
  return {
    issue_id: ticketId(seed.code),
    room_id: room?.room_id ?? '',
    room_number: seed.room,
    problem: seed.issue,
    notes: seed.description ?? null,
    priority: seed.priority,
    status: seed.status,
    assigned_to_staff_id: staff?.staff_id ?? null,
    technician_name: staff?.full_name ?? null,
    created_at: ago(seed.reported),
    updated_at: ago(seed.updated),
    expected_resolution_at: seed.expected === undefined ? null : ago(-seed.expected),
    resolved_at: seed.took === undefined ? null : ago(seed.reported - seed.took),
  };
}

const tickets: MockTicket[] = seeds.map(toTicket);
let nextCode = 129;

function errorResponse(code: string, message: string, status: number) {
  return HttpResponse.json({ error: { code, message } }, { status });
}

const technicianById = (id: unknown) => mockTechnicians.find((technician) => technician.staff_id === id);

export const managerMaintenanceHandlers = [
  http.get(`${API}/manager/maintenance-issues`, () =>
    HttpResponse.json({ data: tickets, meta: { page: 1, limit: 100, total: tickets.length, total_pages: 1 } })),

  http.post(`${API}/manager/maintenance-issues`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const room = findMockRoom(body.room_id);
    const problem = typeof body.problem === 'string' ? body.problem.trim() : '';
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    if (!room || problem.length < 3 || problem.length > PROBLEM_MAX_LENGTH || notes.length > NOTES_MAX_LENGTH
      || !PRIORITIES.includes(body.priority as Priority)) {
      return errorResponse('VALIDATION_ERROR', 'room_id, problem and priority are required.', 400);
    }
    const technician = body.assigned_to_staff_id ? technicianById(body.assigned_to_staff_id) : null;
    if (body.assigned_to_staff_id && !technician) return errorResponse('VALIDATION_ERROR', 'Unknown technician.', 400);
    const now = new Date().toISOString();
    const created: MockTicket = {
      issue_id: ticketId(nextCode++),
      room_id: room.room_id,
      room_number: room.room_number,
      problem,
      notes: notes || null,
      priority: body.priority as Priority,
      status: 'OPEN',
      assigned_to_staff_id: technician?.staff_id ?? null,
      technician_name: technician?.full_name ?? null,
      created_at: now,
      updated_at: now,
      expected_resolution_at: null,
      resolved_at: null,
    };
    tickets.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(`${API}/manager/maintenance-issues/:id`, async ({ params, request }) => {
    const found = tickets.find((item) => item.issue_id === params.id);
    if (!found) return errorResponse('NOT_FOUND', 'Ticket not found.', 404);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (body.status !== undefined && !STATUSES.includes(body.status as Status)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid status.', 400);
    }
    if (found.status === 'RESOLVED' && body.status !== undefined && body.status !== 'RESOLVED') {
      return errorResponse('CONFLICT', 'A resolved ticket cannot be reopened.', 409);
    }
    if ('assigned_to_staff_id' in body) {
      const technician = body.assigned_to_staff_id === null ? null : technicianById(body.assigned_to_staff_id);
      if (body.assigned_to_staff_id !== null && !technician) return errorResponse('VALIDATION_ERROR', 'Unknown technician.', 400);
      found.assigned_to_staff_id = technician?.staff_id ?? null;
      found.technician_name = technician?.full_name ?? null;
    }
    if (body.status !== undefined && body.status !== found.status) {
      found.status = body.status as Status;
      found.resolved_at = found.status === 'RESOLVED' ? new Date().toISOString() : null;
    }
    if ('expected_resolution_at' in body) {
      found.expected_resolution_at = typeof body.expected_resolution_at === 'string' ? body.expected_resolution_at : null;
    }
    found.updated_at = new Date().toISOString();
    return HttpResponse.json(found);
  }),
];

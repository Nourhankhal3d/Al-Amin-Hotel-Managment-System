import type {
  CreateMaintenanceRequestInput,
  IssueType,
  MaintenanceRequest,
  RequestLogEntry,
  RequestPriority,
  RequestStatus,
  UpdateMaintenanceStatusInput,
} from '../types/maintenance.types';

// TEMP: in-memory mock until the real endpoints are ready.
// TODO: replace each function body with a call through core/api/apiClient
// (the old service used apiRequest('/maintenance/requests'); confirm endpoints with backend).

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

interface MockSeed {
  ref: number;
  room: string;
  type: IssueType;
  // Sample of text typed by a receptionist, it is shown as typed
  title: string;
  status: RequestStatus;
  priority: RequestPriority;
  reported: number;
  updated: number;
  expectedIn?: number;
  notes?: string;
}

const SEEDS: MockSeed[] = [
  { ref: 128, room: '112', type: 'ac', title: 'المكيّف لا يبرّد', status: 'in_progress', priority: 'critical', reported: 120, updated: 8, expectedIn: 60,
    notes: 'المكيّف لا يبرّد في غرفة الضيف. تم إبلاغ الفريق الفني مع طلب الفحص في أقرب وقت.' },
  { ref: 127, room: '305', type: 'plumbing', title: 'ضعف ضغط المياه', status: 'pending', priority: 'high', reported: 150, updated: 32, expectedIn: 90 },
  { ref: 126, room: '202', type: 'electrical', title: 'إضاءة المرآة', status: 'resolved', priority: 'medium', reported: 140, updated: 98 },
  { ref: 125, room: '206', type: 'furniture', title: 'قفل النافذة', status: 'in_progress', priority: 'low', reported: 165, updated: 60, expectedIn: 120 },
  { ref: 124, room: '308', type: 'ac', title: 'تسريب من وحدة التكييف', status: 'pending', priority: 'critical', reported: 30, updated: 30 },
  { ref: 123, room: '101', type: 'plumbing', title: 'انسداد في الحوض', status: 'pending', priority: 'medium', reported: 200, updated: 190 },
  { ref: 122, room: '207', type: 'electrical', title: 'مقبس كهرباء لا يعمل', status: 'resolved', priority: 'low', reported: 230, updated: 195 },
  { ref: 121, room: '210', type: 'other', title: 'باب الخزانة مكسور', status: 'resolved', priority: 'low', reported: 260, updated: 215 },
  { ref: 120, room: '312', type: 'plumbing', title: 'تسرّب في الحمّام', status: 'resolved', priority: 'high', reported: 1500, updated: 1450 },
  { ref: 119, room: '102', type: 'ac', title: 'صوت مرتفع من المكيّف', status: 'resolved', priority: 'medium', reported: 1600, updated: 1560 },
  { ref: 118, room: '207', type: 'furniture', title: 'كرسي مكسور', status: 'resolved', priority: 'low', reported: 1700, updated: 1655 },
  { ref: 117, room: '112', type: 'electrical', title: 'مصباح لا يعمل', status: 'pending', priority: 'low', reported: 1800, updated: 1800 },
];

function buildLog(id: string, seed: MockSeed): RequestLogEntry[] {
  const log: RequestLogEntry[] = [{ id: `${id}-1`, event: 'reported', at: minutesAgo(seed.reported) }];
  if (seed.status === 'pending') return log;
  log.push({ id: `${id}-2`, event: 'assigned', at: minutesAgo(seed.reported - 5) });
  log.push({ id: `${id}-3`, event: 'started', at: minutesAgo(Math.max(seed.updated, seed.reported - 15)) });
  if (seed.status === 'resolved') log.push({ id: `${id}-4`, event: 'resolved', at: minutesAgo(seed.updated) });
  return log;
}

function createMockRequests(): MaintenanceRequest[] {
  return SEEDS.map((seed) => {
    const id = `mt-${seed.ref}`;
    return {
      id,
      referenceNumber: seed.ref,
      roomNumber: seed.room,
      issueType: seed.type,
      title: seed.title,
      status: seed.status,
      priority: seed.priority,
      reportedAt: minutesAgo(seed.reported),
      updatedAt: minutesAgo(seed.updated),
      ...(seed.expectedIn ? { expectedFixAt: minutesAgo(-seed.expectedIn) } : {}),
      ...(seed.status === 'resolved' ? { resolvedAt: minutesAgo(seed.updated) } : {}),
      ...(seed.notes ? { notes: seed.notes } : {}),
      log: buildLog(id, seed),
    };
  });
}

let requests = createMockRequests();

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const copy = (request: MaintenanceRequest): MaintenanceRequest => ({ ...request, log: request.log.map((entry) => ({ ...entry })) });

export const maintenanceApi = {
  async getRequests(): Promise<MaintenanceRequest[]> {
    await wait();
    return requests.map(copy);
  },

  async createRequest(input: CreateMaintenanceRequestInput): Promise<MaintenanceRequest> {
    await wait();
    const now = new Date().toISOString();
    const referenceNumber = Math.max(0, ...requests.map((request) => request.referenceNumber)) + 1;
    const id = `mt-${referenceNumber}`;
    const request: MaintenanceRequest = {
      id,
      referenceNumber,
      roomNumber: input.roomNumber,
      issueType: input.issueType,
      title: input.title,
      priority: input.priority,
      status: input.status,
      notes: input.notes,
      reportedAt: now,
      updatedAt: now,
      ...(input.status === 'resolved' ? { resolvedAt: now } : {}),
      log: [{ id: `${id}-1`, event: 'reported', at: now }],
    };
    requests = [request, ...requests];
    return copy(request);
  },

  async updateStatus({ id, status }: UpdateMaintenanceStatusInput): Promise<MaintenanceRequest> {
    await wait();
    const current = requests.find((request) => request.id === id);
    if (!current) throw new Error(`Maintenance request ${id} not found`);
    const now = new Date().toISOString();
    const updated: MaintenanceRequest = {
      ...current,
      status,
      updatedAt: now,
      resolvedAt: status === 'resolved' ? now : undefined,
      log: [...current.log, { id: `${id}-${Date.now()}`, event: 'status_changed', at: now, status }],
    };
    requests = requests.map((request) => (request.id === id ? updated : request));
    return copy(updated);
  },
};

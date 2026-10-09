import type {
  CreateHousekeepingTaskInput,
  HousekeepingTask,
  TaskLogEntry,
  UpdateHousekeepingTaskStatusInput,
} from '../types/housekeeping.types';

// TEMP: in-memory mock until the real endpoints are ready.
// TODO: replace each function body with a call through core/api/apiClient (confirm endpoints with backend).

function todayAt(hours: number, minutes: number): string {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function logEntry(id: string, event: TaskLogEntry['event'], at: string): TaskLogEntry {
  return { id, event, at };
}

function createMockTasks(): HousekeepingTask[] {
  return [
    {
      id: 'hk-1',
      roomNumber: '207',
      taskType: 'checkout',
      status: 'in_progress',
      priority: 'high',
      createdAt: todayAt(10, 58),
      assignedAt: todayAt(11, 5),
      followUpAt: todayAt(12, 30),
      // Sample of text typed by a receptionist, it is shown as typed
      notes: 'يرجى تجهيز الغرفة بالكامل والتأكد من المناشف ومستلزمات الضيافة.',
      log: [
        logEntry('hk-1-1', 'created', todayAt(10, 58)),
        logEntry('hk-1-2', 'assigned', todayAt(11, 5)),
        logEntry('hk-1-3', 'started', todayAt(11, 18)),
      ],
    },
    {
      id: 'hk-2',
      roomNumber: '305',
      taskType: 'precheckin',
      status: 'pending',
      priority: 'critical',
      createdAt: todayAt(11, 5),
      log: [logEntry('hk-2-1', 'created', todayAt(11, 5))],
    },
    {
      id: 'hk-3',
      roomNumber: '112',
      taskType: 'daily',
      status: 'done',
      priority: 'normal',
      createdAt: todayAt(9, 10),
      assignedAt: todayAt(9, 12),
      log: [
        logEntry('hk-3-1', 'created', todayAt(9, 10)),
        logEntry('hk-3-2', 'assigned', todayAt(9, 12)),
        logEntry('hk-3-3', 'done', todayAt(9, 30)),
      ],
    },
    {
      id: 'hk-4',
      roomNumber: '210',
      taskType: 'guest',
      status: 'pending',
      priority: 'high',
      createdAt: todayAt(10, 10),
      log: [logEntry('hk-4-1', 'created', todayAt(10, 10))],
    },
    {
      id: 'hk-5',
      roomNumber: '101',
      taskType: 'precheckin',
      status: 'in_progress',
      priority: 'normal',
      createdAt: todayAt(9, 40),
      assignedAt: todayAt(9, 45),
      followUpAt: todayAt(12, 0),
      log: [
        logEntry('hk-5-1', 'created', todayAt(9, 40)),
        logEntry('hk-5-2', 'assigned', todayAt(9, 45)),
        logEntry('hk-5-3', 'started', todayAt(10, 0)),
      ],
    },
    {
      id: 'hk-6',
      roomNumber: '312',
      taskType: 'checkout',
      status: 'pending',
      priority: 'high',
      createdAt: todayAt(11, 30),
      log: [logEntry('hk-6-1', 'created', todayAt(11, 30))],
    },
    {
      id: 'hk-7',
      roomNumber: '214',
      taskType: 'daily',
      status: 'done',
      priority: 'normal',
      createdAt: todayAt(8, 45),
      assignedAt: todayAt(8, 50),
      log: [
        logEntry('hk-7-1', 'created', todayAt(8, 45)),
        logEntry('hk-7-2', 'assigned', todayAt(8, 50)),
        logEntry('hk-7-3', 'done', todayAt(9, 15)),
      ],
    },
    {
      id: 'hk-8',
      roomNumber: '308',
      taskType: 'guest',
      status: 'in_progress',
      priority: 'critical',
      createdAt: todayAt(11, 40),
      assignedAt: todayAt(11, 42),
      log: [
        logEntry('hk-8-1', 'created', todayAt(11, 40)),
        logEntry('hk-8-2', 'assigned', todayAt(11, 42)),
        logEntry('hk-8-3', 'started', todayAt(11, 50)),
      ],
    },
  ];
}

let tasks = createMockTasks();

const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const copy = (task: HousekeepingTask): HousekeepingTask => ({ ...task, log: task.log.map((entry) => ({ ...entry })) });

export const housekeepingApi = {
  async getTasks(): Promise<HousekeepingTask[]> {
    await wait();
    return tasks.map(copy);
  },

  async createTask(input: CreateHousekeepingTaskInput): Promise<HousekeepingTask> {
    await wait();
    const now = new Date().toISOString();
    const id = `hk-${Date.now()}`;
    const task: HousekeepingTask = {
      id,
      roomNumber: input.roomNumber,
      taskType: input.taskType,
      priority: input.priority,
      notes: input.notes,
      status: input.status,
      createdAt: now,
      log: [logEntry(`${id}-1`, 'created', now)],
    };
    tasks = [task, ...tasks];
    return copy(task);
  },

  async updateTaskStatus({ id, status }: UpdateHousekeepingTaskStatusInput): Promise<HousekeepingTask> {
    await wait();
    const current = tasks.find((task) => task.id === id);
    if (!current) throw new Error(`Housekeeping task ${id} not found`);
    const now = new Date().toISOString();
    const updated: HousekeepingTask = {
      ...current,
      status,
      log: [...current.log, { id: `${id}-${Date.now()}`, event: 'status_changed', at: now, status }],
    };
    tasks = tasks.map((task) => (task.id === id ? updated : task));
    return copy(updated);
  },
};

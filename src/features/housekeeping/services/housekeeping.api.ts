import { HK_FETCH_LIMIT } from '../constants/housekeeping.constants';
import type { CleaningTaskCreate, CleaningTaskUpdate, HousekeepingTask } from '../types/housekeeping.types';

// TEMP: in-memory mock that behaves like the API (same shape, same rules), until the data-layer merge.
// TODO(merge): replace the three function bodies with core/api `request` calls:
//   getHousekeepingTasks   -> request<Paginated<HousekeepingTask>>('/cleaning-tasks', { params: { page: 1, limit: HK_FETCH_LIMIT } }) then `.data`
//   createHousekeepingTask -> request<HousekeepingTask>('/cleaning-tasks', { method: 'POST', body })
//   updateHousekeepingTask -> request<HousekeepingTask>(`/cleaning-tasks/${taskId}`, { method: 'PATCH', body })

const SHIFT_ID = 41;
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function task(
  task_id: number,
  room_id: number,
  priority: HousekeepingTask['priority'],
  assignedMinutesAgo: number,
  extra: Partial<HousekeepingTask> = {},
): HousekeepingTask {
  return {
    task_id,
    room_id,
    priority,
    status: 'pending',
    assigned_date: minutesAgo(assignedMinutesAgo),
    shift_id: SHIFT_ID,
    notes: null,
    cleaner_name: null,
    finished_date: null,
    assigned_by_staff_id: 1,
    ...extra,
  };
}

let tasks: HousekeepingTask[] = [
  // Sample text typed by a receptionist, shown as typed
  task(1, 207, 'high', 80, { cleaner_name: 'منى سعيد', notes: 'يرجى تجهيز الغرفة بالكامل والتأكد من المناشف ومستلزمات الضيافة.' }),
  task(2, 305, 'urgent', 60),
  task(3, 112, 'medium', 200, { status: 'done', cleaner_name: 'أحمد علي', finished_date: minutesAgo(170) }),
  task(4, 210, 'high', 120, { cleaner_name: 'منى سعيد' }),
  task(5, 101, 'low', 150, { cleaner_name: 'سارة محمود' }),
  task(6, 312, 'high', 30),
  task(7, 214, 'medium', 240, { status: 'done', cleaner_name: 'أحمد علي', finished_date: minutesAgo(210) }),
  task(8, 308, 'urgent', 20, { cleaner_name: 'سارة محمود' }),
];

let nextId = 1000;
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const copy = (item: HousekeepingTask): HousekeepingTask => ({ ...item });

export async function getHousekeepingTasks(): Promise<HousekeepingTask[]> {
  await wait();
  return tasks.slice(0, HK_FETCH_LIMIT).map(copy);
}

export async function createHousekeepingTask(body: CleaningTaskCreate): Promise<HousekeepingTask> {
  await wait();
  const created = task(nextId++, body.room_id, body.priority, 0, {
    cleaner_name: body.cleaner_name ?? null,
    notes: body.notes ?? null,
  });
  tasks = [created, ...tasks];
  return copy(created);
}

export async function updateHousekeepingTask(taskId: number, body: CleaningTaskUpdate): Promise<HousekeepingTask> {
  await wait();
  const current = tasks.find((item) => item.task_id === taskId);
  if (!current) throw new Error(`Cleaning task ${taskId} not found`);
  const updated: HousekeepingTask = {
    ...current,
    ...(body.cleaner_name !== undefined ? { cleaner_name: body.cleaner_name } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
    ...(body.status === 'done' ? { status: 'done', finished_date: new Date().toISOString() } : {}),
  };
  tasks = tasks.map((item) => (item.task_id === taskId ? updated : item));
  return copy(updated);
}

import type { HandoverRequest, Shift, ShiftSummary } from '../types/shift-handover.types';

const createdAt = new Date().toISOString();

const mockShift: Shift = {
  shift_id: '41',
  staff_id: '1',
  shift_date: createdAt.slice(0, 10),
  shift_type: 'morning',
  start_time: '07:00',
  end_time: '16:00',
  status: 'active',
  handed_over_at: null,
  shift_notes: null,
};

const mockCleaningTasks: ShiftSummary['cleaning_tasks'] = [
  {
    task_id: 1,
    room_id: 103,
    priority: 'medium',
    status: 'pending',
    assigned_date: createdAt,
    shift_id: 41,
    notes: 'Clean room after checkout',
  },
  {
    task_id: 2,
    room_id: 104,
    priority: 'low',
    status: 'done',
    assigned_date: createdAt,
    finished_date: createdAt,
    shift_id: 41,
  },
];

const mockMaintenanceIssues: ShiftSummary['maintenance_issues'] = [
  {
    issue_id: 1,
    room_id: 102,
    problem: 'Air conditioning inspection',
    priority: 'medium',
    status: 'open',
    created_date: createdAt,
    shift_id: 41,
    staff_id: 1,
  },
  {
    issue_id: 2,
    room_id: 105,
    problem: 'Replaced bedside lamp',
    priority: 'low',
    status: 'resolved',
    created_date: createdAt,
    resolved_date: createdAt,
    shift_id: 41,
    staff_id: 1,
  },
];

const mockUnverifiedPayment: ShiftSummary['pending']['unverified_payments'][number] = {
  payment_id: 900,
  reservation_id: 55,
  staff_id: 1,
  shift_id: 41,
  amount: 1500,
  payment_method: 'cash',
  payment_datetime: createdAt,
  payment_verified: false,
  notes: 'Demo payment',
};

export function getMockShiftSummary(): ShiftSummary {
  const shift = { ...mockShift };
  const cleaningTasks = mockCleaningTasks.map((task) => ({ ...task }));
  const maintenanceIssues = mockMaintenanceIssues.map((issue) => ({ ...issue }));

  return {
    shift,
    payments: {
      cash: 4200,
      instapay: 1800,
      vodafone_cash: 900,
      total: 6900,
    },
    check_ins: 3,
    check_outs: 2,
    rooms_handled: ['101', '102', '103', '104', '105'],
    cleaning_tasks: cleaningTasks,
    maintenance_issues: maintenanceIssues,
    pending: {
      cleaning_tasks: cleaningTasks.filter((task) => task.status === 'pending'),
      maintenance_issues: maintenanceIssues.filter((issue) => issue.status !== 'resolved'),
      unverified_payments: [{ ...mockUnverifiedPayment }],
    },
  };
}

export function submitMockShiftHandover(data: HandoverRequest): Shift {
  mockShift.status = 'handed_over';
  mockShift.handed_over_at = new Date().toISOString();
  mockShift.shift_notes = data.shift_notes ?? null;
  return { ...mockShift };
}

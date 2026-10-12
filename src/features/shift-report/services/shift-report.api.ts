import { request } from '../../../core/api/apiClient';
import type { ShiftSummary } from '../types/shift-report.types';
import type { ShiftSummary as HandoverSummary } from '../../shift-handover/types/shift-handover.types';

export async function getShiftReport(): Promise<ShiftSummary> {
  try {
    const handover = await request<HandoverSummary>('/shifts/current/summary');
    const tasksDone =
      handover.cleaning_tasks.filter((t) => t.status === 'done').length +
      handover.maintenance_issues.filter((i) => i.status === 'resolved').length;
    const totalTasks = handover.cleaning_tasks.length + handover.maintenance_issues.length;
    const score = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 100;

    return {
      date: handover.shift.shift_date,
      checkedIn: handover.check_ins,
      checkedOut: handover.check_outs,
      tasksCompleted: tasksDone,
      staffName: `موظف #${handover.shift.staff_id}`,
      shiftName: handover.shift.shift_type,
      startedAt: `${handover.shift.shift_date}T${handover.shift.start_time}`,
      endedAt: `${handover.shift.shift_date}T${handover.shift.end_time}`,
      performanceScore: score,
      totalCollected: handover.payments.total,
      cashCollected: handover.payments.cash,
      cardCollected: handover.payments.instapay,
      transferCollected: handover.payments.vodafone_cash,
      housekeepingTasks: handover.cleaning_tasks.length,
      maintenanceTasks: handover.maintenance_issues.length,
      reservations: handover.check_ins,
      notes: handover.shift.shift_notes ?? undefined,
    };
  } catch {
    return request<ShiftSummary>('/shift-report');
  }
}


import { request } from '../../../core/api/apiClient';
import { getAuthSession } from '../../../core/auth/authManager';
import type { ShiftSummary } from '../types/shift-report.types';
import type { ShiftSummary as HandoverSummary } from '../../shift-handover/types/shift-handover.types';

interface DashboardOccupancyResponse {
  total_rooms: number;
  rooms_by_status: {
    occupied: number;
    available: number;
    reserved: number;
    cleaning: number;
    maintenance: number;
  };
}

// A night shift ends on the next calendar day (for example 23:00 -> 07:00).
function addOneDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export async function getShiftReport(): Promise<ShiftSummary> {
  try {
    const handover = await request<HandoverSummary>('/shifts/current/summary');
    const dashboardResult = await Promise.allSettled([
      request<DashboardOccupancyResponse>('/dashboard'),
    ]);
    const dashboard = dashboardResult[0].status === 'fulfilled'
      ? dashboardResult[0].value
      : undefined;
    const tasksDone =
      handover.cleaning_tasks.filter((t) => t.status === 'done').length +
      handover.maintenance_issues.filter((i) => i.status === 'resolved').length;
    const totalTasks = handover.cleaning_tasks.length + handover.maintenance_issues.length;
    const score = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 100;
    const endDate =
      handover.shift.end_time <= handover.shift.start_time
        ? addOneDay(handover.shift.shift_date)
        : handover.shift.shift_date;

    return {
      date: handover.shift.shift_date,
      checkedIn: handover.check_ins,
      checkedOut: handover.check_outs,
      tasksCompleted: tasksDone,
      staffName: getAuthSession()?.staffName,
      shiftName: handover.shift.shift_type,
      startedAt: `${handover.shift.shift_date}T${handover.shift.start_time}`,
      endedAt: `${endDate}T${handover.shift.end_time}`,
      performanceScore: score,
      totalCollected: handover.payments.total,
      cashCollected: handover.payments.cash,
      cardCollected: handover.payments.instapay,
      transferCollected: handover.payments.vodafone_cash,
      housekeepingTasks: handover.cleaning_tasks.length,
      maintenanceTasks: handover.maintenance_issues.length,
      reservations: handover.check_ins,
      notes: handover.shift.shift_notes ?? undefined,
      occupancyRate: dashboard && dashboard.total_rooms > 0
        ? ((dashboard.rooms_by_status.occupied ?? 0) / dashboard.total_rooms) * 100
        : undefined,
      handoverStatus: handover.shift.status === 'handed_over' ? 'handed_over' : 'pending',
      completedTaskLogs: [
        ...handover.cleaning_tasks
          .filter((task) => task.status === 'done')
          .map((task) => ({
            id: `housekeeping-${task.task_id}`,
            type: 'housekeeping' as const,
            room: String(task.room_id),
            description: task.notes ?? '',
            completedAt: task.finished_date ?? undefined,
          })),
        ...handover.maintenance_issues
          .filter((issue) => issue.status === 'resolved')
          .map((issue) => ({
            id: `maintenance-${issue.issue_id}`,
            type: 'maintenance' as const,
            room: String(issue.room_id),
            description: issue.problem,
            completedAt: issue.resolved_date ?? undefined,
          })),
      ],
      roomStatus: dashboard ? {
        total: dashboard.total_rooms,
        occupied: dashboard.rooms_by_status.occupied ?? 0,
        available: dashboard.rooms_by_status.available ?? 0,
        reserved: dashboard.rooms_by_status.reserved ?? 0,
        cleaning: dashboard.rooms_by_status.cleaning ?? 0,
        maintenance: dashboard.rooms_by_status.maintenance ?? 0,
      } : undefined,
      salesBreakdown: [
        { id: 'cash', category: 'cash', amount: handover.payments.cash },
        { id: 'card', category: 'card', amount: handover.payments.instapay },
        { id: 'transfer', category: 'transfer', amount: handover.payments.vodafone_cash },
      ],
    };
  } catch {
    return request<ShiftSummary>('/shift-report');
  }
}

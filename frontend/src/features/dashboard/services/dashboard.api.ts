import { ROUTES } from '../../../core/constants/routes';
import { getCairoNow } from '../../rooms/utils/walkInDates';
import { getRooms } from '../../rooms/services/rooms.api';
import { request } from '../../../core/api/apiClient';
import { mockShiftSummary } from '../../../mocks/dashboard';
import type { DashboardSummary } from '../types/dashboard.types';

export const mockDashboardSummary: DashboardSummary = {
  revenueTotal: 24850,
  // TODO: confirm with backend; the dashboard endpoint has no revenue-change field.
  revenueChangePercent: 12.4,
  cashRevenue: 16900,
  digitalRevenue: 7950,
  // TODO: confirm with backend; the dashboard endpoint has no weekly revenue series.
  revenue: [
    { dayKey: 'saturday', value: 9200 },
    { dayKey: 'sunday', value: 11300 },
    { dayKey: 'monday', value: 10800 },
    { dayKey: 'tuesday', value: 13300 },
    { dayKey: 'wednesday', value: 15100 },
    { dayKey: 'thursday', value: 13700 },
    { dayKey: 'friday', value: 17200 },
  ],
   stats: [
    { id: 'rooms-prepared', labelKey: 'dashboard.stats.roomsPrepared.label', value: 12, format: 'number', icon: 'bed', tone: 'green' },
    { id: 'checkins', labelKey: 'dashboard.stats.checkins.label', value: 6, format: 'number', icon: 'transfer', tone: 'green' },
    { id: 'checkouts', labelKey: 'dashboard.stats.checkouts.label', value: 4, format: 'number', icon: 'login', tone: 'gold' },
    { id: 'pending-tasks', labelKey: 'dashboard.stats.pending.label', value: 5, format: 'number', icon: 'clock', tone: 'gold' },
    { id: 'revenue', labelKey: 'dashboard.stats.revenue.label', value: 24850, format: 'currency', icon: 'wallet', tone: 'gold' },
  ],
  // TODO: confirm with backend; the dashboard endpoint has no recent-activity feed.
  activity: [
    { id: 'activity-1', titleKey: 'dashboard.activity.items.checkin.title', descriptionKey: 'dashboard.activity.items.checkin.description', timeMinutesAgo: 12, icon: 'login', tone: 'green' },
    { id: 'activity-2', titleKey: 'dashboard.activity.items.checkout.title', descriptionKey: 'dashboard.activity.items.checkout.description', timeMinutesAgo: 18, icon: 'transfer', tone: 'green' },
    { id: 'activity-3', titleKey: 'dashboard.activity.items.maintenance.title', descriptionKey: 'dashboard.activity.items.maintenance.description', timeMinutesAgo: 31, icon: 'wrench', tone: 'gold' },
    { id: 'activity-4', titleKey: 'dashboard.activity.items.cleaning.title', descriptionKey: 'dashboard.activity.items.cleaning.description', timeMinutesAgo: 41, icon: 'bed', tone: 'green' },
  ],
  // TODO: confirm with backend; the dashboard endpoint has no needs-attention list.
  needsAttention: [],
  attentionOpenCount: 0,
  // TODO: confirm with backend; quick actions are UI configuration, not API data.
  quickActions: [
    { id: 'quick-add-task', labelKey: 'dashboard.quickActions.addTask', icon: 'check', route: ROUTES.shiftHandover, primary: true },
    { id: 'quick-shift-note', labelKey: 'dashboard.quickActions.shiftNote', icon: 'sparkles', route: ROUTES.shiftHandover },
    { id: 'quick-payment', labelKey: 'dashboard.quickActions.payment', icon: 'wallet', route: ROUTES.payments },
    { id: 'quick-checkout', labelKey: 'dashboard.quickActions.checkout', icon: 'login', route: ROUTES.rooms },
    { id: 'quick-report', labelKey: 'dashboard.quickActions.report', icon: 'file', route: ROUTES.shiftReport },
    { id: 'quick-handover', labelKey: 'dashboard.quickActions.handover', icon: 'transfer', route: ROUTES.shiftHandover },
  ],
  // TODO: confirm with backend; no shift-progress fields are in GET /dashboard.
  shift: mockShiftSummary,
  pulse: { revenue: 24850, pendingTasks: 5, completedTasks: 14, arrivals: 18 },
};

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

interface ApiCleaningTask {
  task_id: string;
  room_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

interface ApiMaintenanceIssue {
  issue_id: string;
  room_id: string;
  problem: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

function severityFromPriority(priority: string): 'critical' | 'high' | 'normal' {
  if (priority === 'urgent') return 'critical';
  if (priority === 'high') return 'high';
  return 'normal';
}

interface DashboardApiResponse {
  total_rooms: number;
  rooms_by_status: {
    available: number;
    reserved: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
  };
  rooms_needing_cleaning: number;
  open_maintenance_issues: number;
  shift_payments_total: {
    cash: number;
    instapay: number;
    vodafone_cash: number;
    total: number;
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { date: today } = getCairoNow();

  const [response, pendingCleaning, doneCleaning, openIssues, todaysReservations, rooms] = await Promise.all([
    request<DashboardApiResponse>('/dashboard'),
    request<Paginated<ApiCleaningTask>>('/cleaning-tasks', { params: { status: 'pending', limit: 20 } }),
    request<Paginated<ApiCleaningTask>>('/cleaning-tasks', { params: { status: 'done', limit: 1 } }),
    request<Paginated<ApiMaintenanceIssue>>('/maintenance-issues', { params: { status: 'open', limit: 20 } }),
    request<Paginated<unknown>>('/reservations', { params: { check_in_from: `${today}T00:00:00+03:00`, check_in_to: `${today}T23:59:59+03:00`, limit: 1 } }),
    getRooms(),
  ]);

  const roomNumberById = new Map(rooms.map((room) => [String(room.id), room.number]));

  const checkedOutToday = await request<Paginated<unknown>>('/reservations', {
    params: { status: 'checked_out', check_in_from: `${today}T00:00:00+03:00`, check_in_to: `${today}T23:59:59+03:00`, limit: 1 },
  });

    const stats = mockDashboardSummary.stats.map((stat) => {
    switch (stat.id) {
      case 'rooms-prepared':
        return { ...stat, value: response.rooms_by_status?.available ?? response.total_rooms };
      case 'revenue':
        return { ...stat, value: response.shift_payments_total.total };
      case 'pending-tasks':
        return { ...stat, value: pendingCleaning.meta.total + openIssues.meta.total };
      case 'checkins':
        return { ...stat, value: todaysReservations.meta.total };
      case 'checkouts':
        return { ...stat, value: checkedOutToday.meta.total };
      default:
        return stat;
    }
  });

  const severityRank = { critical: 0, high: 1, normal: 2 } as const;

  const maintenanceItems = openIssues.data.map((issue) => ({
    id: `issue-${issue.issue_id}`,
    titleKey: issue.problem,
    detailKey: `غرفة ${roomNumberById.get(String(issue.room_id)) ?? issue.room_id}`,
    severity: severityFromPriority(issue.priority),
    icon: 'wrench' as const,
  }));

  const cleaningItems = pendingCleaning.data.map((task) => ({
    id: `cleaning-${task.task_id}`,
    titleKey: task.notes || 'dashboard.attention.cleaningTask',
    detailKey: `غرفة ${roomNumberById.get(String(task.room_id)) ?? task.room_id}`,
    severity: severityFromPriority(task.priority),
    icon: 'sparkles' as const,
  }));

  const needsAttention = [...maintenanceItems, ...cleaningItems]
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  return {
    ...mockDashboardSummary,
    revenueTotal: response.shift_payments_total.total,
    cashRevenue: response.shift_payments_total.cash,
    digitalRevenue: response.shift_payments_total.instapay + response.shift_payments_total.vodafone_cash,
    stats,
    needsAttention,
    attentionOpenCount: openIssues.meta.total + pendingCleaning.meta.total,
    pulse: {
      ...mockDashboardSummary.pulse,
      revenue: response.shift_payments_total.total,
      pendingTasks: pendingCleaning.meta.total,
      completedTasks: doneCleaning.meta.total,
      arrivals: todaysReservations.meta.total,
    },
  };
}
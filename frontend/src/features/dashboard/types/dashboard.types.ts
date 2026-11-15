import type { AppRoute } from '../../../core/constants/routes';

export type DashboardIconKey =
  | 'bed'
  | 'sparkles'
  | 'wrench'
  | 'wallet'
  | 'login'
  | 'transfer'
  | 'check'
  | 'clock'
  | 'file';

export interface DashboardStat {
  id: string;
  labelKey: string;
  value: number;
  format: 'number' | 'currency';
  icon: DashboardIconKey;
  tone: 'green' | 'gold';
}

export interface RevenuePoint {
  dayKey: string;
  value: number;
}

export interface DashboardActivityItem {
  id: string;
  kind: 'payment' | 'cleaningAssigned' | 'cleaningDone' | 'maintenanceReported' | 'maintenanceResolved';
  roomNumber?: string;
  amount?: number;
  method?: string;
  at: string;
  icon: DashboardIconKey;
  tone: 'green' | 'gold';
}

export interface NeedsAttentionItem {
  id: string;
  titleKey: string;
  detailKey: string;
  severity: 'critical' | 'high' | 'normal';
  icon: DashboardIconKey;
}

export interface DashboardQuickAction {
  id: string;
  labelKey: string;
  icon: DashboardIconKey;
  route: AppRoute;
  primary?: boolean;
}

export interface DashboardSummary {
  revenueTotal: number;
  revenueChangePercent: number;
  cashRevenue: number;
  digitalRevenue: number;
  revenue: RevenuePoint[];
  stats: DashboardStat[];
  activity: DashboardActivityItem[];
  needsAttention: NeedsAttentionItem[];
  attentionOpenCount: number;
  quickActions: DashboardQuickAction[];
  shift: {
    progressPercent: number;
    remainingHours: number;
    remainingMinutes: number;
  };
  pulse: {
    revenue: number;
    pendingTasks: number;
    completedTasks: number;
    arrivals: number;
  };
}

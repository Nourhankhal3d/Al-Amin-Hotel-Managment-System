import { request } from '../../../core/api/apiClient';
import type { SubManagerDashboardSummary } from '../types/submanager-dashboard.types';

export const subManagerDashboardQueryKeys = {
  summary: ['submanager-dashboard', 'summary'] as const,
};

export function getSubManagerDashboardSummary(): Promise<SubManagerDashboardSummary> {
  return request<SubManagerDashboardSummary>('/sub-manager/dashboard');
}
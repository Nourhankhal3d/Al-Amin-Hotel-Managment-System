
import { request } from '../../../core/api/apiClient';
import type { DashboardSummary } from '../types/dashboard.types';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>('/dashboard');
}
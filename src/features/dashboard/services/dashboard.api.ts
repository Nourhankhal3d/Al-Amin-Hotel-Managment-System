import { apiRequest } from '../../../core/api/apiClient';
import type { DashboardSummary } from '../types/dashboard.types';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard/summary');
}

import { apiRequest } from '../../../core/api/apiClient';
import type { ShiftSummary } from '../types/shift-report.types';

export async function getShiftReport(): Promise<ShiftSummary> {
  return apiRequest<ShiftSummary>('/shift-report');
}

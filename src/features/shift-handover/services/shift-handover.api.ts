import { apiRequest } from '../../../core/api/apiClient';
import type { Shift, ShiftSummary } from '../types/shift-handover.types';

export async function getShiftHandover(): Promise<Shift[]> {
  return apiRequest<Shift[]>('/shift-handover');
}

export async function getShiftSummary(): Promise<ShiftSummary> {
  return apiRequest<ShiftSummary>('/shift-handover/summary');
}

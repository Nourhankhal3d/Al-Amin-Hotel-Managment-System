import { apiRequest } from '../../../core/api/apiClient';
import type { PersonalShift, ShiftSummary } from '../types/shift-report.types';

export async function getShiftReport(): Promise<ShiftSummary> {
  return apiRequest<ShiftSummary>('/shift-report');
}

export async function getPersonalShift(): Promise<PersonalShift> {
  return apiRequest<PersonalShift>('/shift-report/personal');
}

export async function startShift(): Promise<PersonalShift> {
  return apiRequest<PersonalShift>('/shift-report/personal/start', { method: 'POST' });
}

export async function endShift(): Promise<PersonalShift> {
  return apiRequest<PersonalShift>('/shift-report/personal/end', { method: 'POST' });
}


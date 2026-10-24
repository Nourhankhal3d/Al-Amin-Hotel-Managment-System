import { request } from '../../../core/api/apiClient';
import type {
  HandoverRequest,
  Shift,
  ShiftSummary,
} from '../types/shift-handover.types';
import { getMockShiftSummary, submitMockShiftHandover } from './shift-handover.mock';

export async function getShiftSummary(): Promise<ShiftSummary> {
  try {
    return await request<ShiftSummary>('/shifts/current/summary');
  } catch (error) {
    if (!import.meta.env.DEV) throw error;

    console.warn('Shift summary request failed; using local development shift data.', error);
    return getMockShiftSummary();
  }
}

export async function submitShiftHandover(data: HandoverRequest): Promise<Shift> {
  try {
    return await request<Shift>('/shifts/current/handover', {
      method: 'PATCH',
      body: data,
    });
  } catch (error) {
    if (!import.meta.env.DEV) throw error;

    console.warn('Shift handover request failed; completing it with local development data.', error);
    return submitMockShiftHandover(data);
  }
}

export function getShiftReport(shiftId: string): Promise<Blob> {
  return request<Blob>(`/shifts/${shiftId}/report`, { responseType: 'blob' });
}
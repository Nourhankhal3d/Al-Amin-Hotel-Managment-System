
import { request } from '../../../core/api/apiClient';
import type {
  HandoverRequest,
  Shift,
  ShiftSummary,
} from '../types/shift-handover.types';

export async function getShiftSummary(): Promise<ShiftSummary> {
  return request<ShiftSummary>('/shifts/current/summary');
}

export async function submitShiftHandover(
  data: HandoverRequest = {},
): Promise<Shift> {
  return request<Shift>('/shifts/current/handover', {
    method: 'PATCH',
    body: data,
  });
}

export async function getShiftReport(shiftId: number): Promise<Blob> {
  return request<Blob>(`/shifts/${shiftId}/report`, {
    responseType: 'blob',
  });
}
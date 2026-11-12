import { request } from '../../../core/api/apiClient';
import type { ReportFilters, SubManagerReportsData } from '../types/submanager-reports.types';

export const subManagerReportsQueryKeys = {
  all: ['submanager-reports'] as const,
  report: (filters: ReportFilters) => [...subManagerReportsQueryKeys.all, filters] as const,
};

export function getSubManagerReports(filters: ReportFilters): Promise<SubManagerReportsData> {
  return request<SubManagerReportsData>('/sub-manager/reports', {
    params: {
      period: filters.period,
      from: filters.dateFrom || undefined,
      to: filters.dateTo || undefined,
      category: filters.category || undefined,
      status: filters.status || undefined,
      paymentMethod: filters.paymentMethod || undefined,
      room: filters.room || undefined,
      type: filters.type || undefined,
      floor: filters.floor || undefined,
      roomType: filters.roomType || undefined,
      roomStatus: filters.roomStatus || undefined,
      shift: filters.shift || undefined,
    },
  });
}

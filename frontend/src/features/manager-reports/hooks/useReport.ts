import { useQuery } from '@tanstack/react-query';
import { getAggregatedReport, reportQueryKeys } from '../services/manager-reports.api';
import { mapAggregatedDtoToSnapshot } from '../services/manager-reports.mappers';
import type { ReportFilters, ReportPeriod, ReportSnapshot } from '../types/manager-reports.types';
import { useLanguage } from '../../../core/i18n/useLanguage';

export function useReport(
  period: ReportPeriod = 'daily',
  filters?: Partial<ReportFilters>,
  range?: { startDate?: string; endDate?: string },
) {
  const { language } = useLanguage();

  const queryParams = {
    period,
    date: filters?.date,
    floor: filters?.floor,
    room_type: filters?.roomType,
    shift: filters?.shift,
    room_status: filters?.roomStatus,
    payment_method: filters?.paymentMethod,
    expense_category: filters?.expenseCategory,
    start_date: range?.startDate,
    end_date: range?.endDate,
  };

  return useQuery<ReportSnapshot>({
    queryKey: reportQueryKeys.aggregated(queryParams),
    queryFn: async () => {
      const dto = await getAggregatedReport(queryParams);
      return mapAggregatedDtoToSnapshot(dto, language === 'ar' ? 'ar' : 'en');
    },
    staleTime: 30_000,
  });
}

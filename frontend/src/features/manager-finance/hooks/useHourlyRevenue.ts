import { useQuery } from '@tanstack/react-query';
import { getHourlyRevenue, financeQueryKeys } from '../services/manager-finance.api';
import type { HourlyRevenueDto } from '../types/manager-finance.dto';

export function useHourlyRevenue() {
  return useQuery<HourlyRevenueDto>({
    queryKey: financeQueryKeys.hourlyRevenue(),
    queryFn: getHourlyRevenue,
    staleTime: 60_000,
  });
}

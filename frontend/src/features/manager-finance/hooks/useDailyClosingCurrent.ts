import { useQuery } from '@tanstack/react-query';
import { getDailyClosingCurrent, financeQueryKeys } from '../services/manager-finance.api';
import type { DailyClosingCurrentDto } from '../types/manager-finance.dto';

export function useDailyClosingCurrent() {
  return useQuery<DailyClosingCurrentDto>({
    queryKey: financeQueryKeys.dailyClosing(),
    queryFn: getDailyClosingCurrent,
    staleTime: 30_000,
  });
}

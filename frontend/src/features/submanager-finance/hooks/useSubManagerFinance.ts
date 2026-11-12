import { useQuery } from '@tanstack/react-query';
import { getSubManagerFinanceData, subManagerFinanceQueryKeys } from '../services/finance.api';

export function useSubManagerFinance() {
  return useQuery({
    queryKey: subManagerFinanceQueryKeys.ledger(),
    queryFn: getSubManagerFinanceData,
  });
}
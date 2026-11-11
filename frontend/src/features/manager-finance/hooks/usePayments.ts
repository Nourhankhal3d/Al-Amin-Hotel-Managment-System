import { useQuery } from '@tanstack/react-query';
import { getPayments, financeQueryKeys } from '../services/manager-finance.api';
import { mapPaymentDtoToTransaction } from '../services/manager-finance.mappers';
import type { PaymentsQueryFiltersDto } from '../types/manager-finance.dto';
import type { FinanceTransactionList } from '../types/manager-finance.types';
import { useLanguage } from '../../../core/i18n/useLanguage';

export function usePayments(filters: PaymentsQueryFiltersDto = {}, page = 1) {
  const { language } = useLanguage();
  const queryFilters = { ...filters, page };

  return useQuery<FinanceTransactionList>({
    queryKey: financeQueryKeys.payments(queryFilters),
    queryFn: async () => {
      const res = await getPayments(queryFilters);
      return {
        transactions: res.data.map((item) =>
          mapPaymentDtoToTransaction(item, language === 'ar' ? 'ar' : 'en'),
        ),
        total: res.meta.total,
        page: res.meta.page,
        totalPages: res.meta.total_pages,
        limit: res.meta.limit,
      };
    },
    staleTime: 30_000,
  });
}

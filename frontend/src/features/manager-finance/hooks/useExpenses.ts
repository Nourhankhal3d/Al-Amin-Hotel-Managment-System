import { useQuery } from '@tanstack/react-query';
import { getExpenses, financeQueryKeys } from '../services/manager-finance.api';
import { mapExpenseDtoToExpense } from '../services/manager-finance.mappers';
import type { ExpensesQueryFiltersDto } from '../types/manager-finance.dto';
import type { FinanceExpenseList } from '../types/manager-finance.types';
import { useLanguage } from '../../../core/i18n/useLanguage';

export function useExpenses(filters: ExpensesQueryFiltersDto = {}, page = 1) {
  const { language } = useLanguage();
  const queryFilters = { ...filters, page };

  return useQuery<FinanceExpenseList>({
    queryKey: financeQueryKeys.expenses(queryFilters),
    queryFn: async () => {
      const res = await getExpenses(queryFilters);
      return {
        expenses: res.data.map((item) =>
          mapExpenseDtoToExpense(item, language === 'ar' ? 'ar' : 'en'),
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

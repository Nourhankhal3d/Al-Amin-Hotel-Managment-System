import { Wallet, ReceiptText, Check } from 'lucide-react';
import { StatCard } from '../../../components/ui/StatCard';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatCurrency } from '../../../utils/format';
import './FinanceStatCards.css';

export interface FinanceStatCardsProps {
  totalRevenue: number;
  totalExpenses: number;
  netShift: number;
  className?: string;
}

export function FinanceStatCards({
  totalRevenue,
  totalExpenses,
  netShift,
  className = '',
}: FinanceStatCardsProps) {
  const { language, t } = useLanguage();

  return (
    <section
      className={`finance-stat-cards ${className}`.trim()}
      aria-label={t('manager.finance.stats.netShift')}
    >
      {/* 1. Total Revenue Card (Revenues) */}
      <StatCard
        label={t('manager.finance.stats.totalRevenue')}
        value={formatCurrency(totalRevenue, language)}
        icon={<Wallet aria-hidden="true" />}
        tone="teal"
        hint={t('manager.finance.stats.recordedAutoHint')}
        className="finance-stat-cards__item"
      />

      {/* 2. Total Expenses Card */}
      <StatCard
        label={t('manager.finance.stats.totalExpenses')}
        value={formatCurrency(totalExpenses, language)}
        icon={<ReceiptText aria-hidden="true" />}
        tone="amber"
        hint={t('manager.finance.stats.recordedAutoHint')}
        className="finance-stat-cards__item"
      />

      {/* 3. Net Shift Card (Revenue - Expenses) */}
      <StatCard
        label={t('manager.finance.stats.netShift')}
        value={formatCurrency(netShift, language)}
        icon={<Check aria-hidden="true" />}
        tone="green"
        hint={t('manager.finance.stats.netProfitHint')}
        className="finance-stat-cards__item"
      />
    </section>
  );
}

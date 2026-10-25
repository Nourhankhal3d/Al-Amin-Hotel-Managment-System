import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { getTranslation, type Language } from '../../../core/i18n';
import './PaymentsTabs.css';

export type PaymentsTab = 'income' | 'expenses';

interface PaymentsTabsProps {
  tab: PaymentsTab;
  language: Language;
  onChange: (tab: PaymentsTab) => void;
  onAdd: () => void;
}

// The white switch (Income | Expenses) and the green add button that follows the active tab
export function PaymentsTabs({ tab, language, onChange, onAdd }: PaymentsTabsProps) {
  const t = (key: string) => getTranslation(language, key);
  const items: Array<{ value: PaymentsTab; label: string }> = [
    { value: 'income', label: t('paymentsPage.tabs.income') },
    { value: 'expenses', label: t('paymentsPage.tabs.expenses') },
  ];

  return (
    <Card className="payments-tabs">
      <div className="payments-tabs__switch" role="tablist" aria-label={t('paymentsPage.tabs.label')}>
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            className={tab === item.value ? 'payments-tabs__tab payments-tabs__tab--active' : 'payments-tabs__tab'}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Button type="button" onClick={onAdd}>
        <Plus aria-hidden="true" />
        {tab === 'income' ? t('paymentsPage.addIncome') : t('paymentsPage.addExpense')}
      </Button>
    </Card>
  );
}
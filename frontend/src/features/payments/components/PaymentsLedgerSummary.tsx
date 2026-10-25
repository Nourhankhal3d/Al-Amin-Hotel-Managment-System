import { Check, Receipt, Wallet } from 'lucide-react';
import { StatCard } from '../../../components/ui/StatCard';
import { getTranslation, type Language } from '../../../core/i18n';
import type { Expense } from '../services/expenses.api';
import type { Payment } from '../types/payment.types';
import { formatAmount } from '../utils/paymentsFormat';
import './PaymentsLedgerSummary.css';

interface PaymentsLedgerSummaryProps {
  payments: Payment[];
  expenses: Expense[];
  language: Language;
}

const sumOf = (rows: Array<{ amount: number }>) =>
  rows.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0);

// Income, expenses and the shift net (income minus expenses), all for the current shift
export function PaymentsLedgerSummary({ payments, expenses, language }: PaymentsLedgerSummaryProps) {
  const t = (key: string) => getTranslation(language, key);
  const income = sumOf(payments);
  const spent = sumOf(expenses);

  return (
    <section className="payments-ledger" aria-label={t('paymentsPage.ledger.title')}>
      <StatCard
        label={t('paymentsPage.ledger.income')}
        value={formatAmount(income, language)}
        hint={t('paymentsPage.ledger.incomeHint')}
        icon={<Wallet />}
        tone="green"
      />
      <StatCard
        label={t('paymentsPage.ledger.expenses')}
        value={formatAmount(spent, language)}
        hint={t('paymentsPage.ledger.expensesHint')}
        icon={<Receipt />}
        tone="gold"
      />
      <StatCard
        label={t('paymentsPage.ledger.net')}
        value={formatAmount(income - spent, language)}
        hint={t('paymentsPage.ledger.netHint')}
        icon={<Check />}
        tone="green"
      />
    </section>
  );
}
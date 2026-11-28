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

const NEGATIVE_CARD = 'payments-ledger__card--negative';

const sumOf = (rows: Array<{ amount: number }>) =>
  rows.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0);

// Income, expenses and the shift net (income minus expenses), all for the current shift.
// Money going out is shown with a minus sign, and any negative figure is red.
export function PaymentsLedgerSummary({ payments, expenses, language }: PaymentsLedgerSummaryProps) {
  const t = (key: string) => getTranslation(language, key);
  const income = sumOf(payments);
  const spent = sumOf(expenses);
  const net = income - spent;

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
        value={formatAmount(spent > 0 ? -spent : 0, language)}
        hint={t('paymentsPage.ledger.expensesHint')}
        icon={<Receipt />}
        tone="gold"
        className={spent > 0 ? NEGATIVE_CARD : ''}
      />
      <StatCard
        label={t('paymentsPage.ledger.net')}
        value={formatAmount(net, language)}
        hint={t('paymentsPage.ledger.netHint')}
        icon={<Check />}
        tone="green"
        className={net < 0 ? NEGATIVE_CARD : ''}
      />
    </section>
  );
}
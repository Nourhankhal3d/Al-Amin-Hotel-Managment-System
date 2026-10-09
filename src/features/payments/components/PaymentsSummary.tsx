import type { ReactNode } from 'react';
import { CalcIcon, CardIcon, CashIcon, HashIcon, TransferIcon, WalletIcon } from '../../../components/ui/Icons';
import { PAYMENT_METHODS } from '../../../core/constants/paymentMethods';
import { formatCompact, formatMoney } from '../../../core/utils/numerals';
import type { Payment } from '../types/payment.types';

interface PaymentsSummaryProps {
  payments: Payment[];
}

function totalOf(payments: Payment[], method?: string): number {
  return payments
    .filter((payment) => !method || payment.method === method)
    .reduce((sum, payment) => sum + (Number.isFinite(payment.amount) ? payment.amount : 0), 0);
}

function StatTile({ label, value, icon, tone }: {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: 'gold' | 'rose';
}) {
  return (
    <div className="al-stat">
      <div className="al-stat__body">
        <span className="al-stat__label">{label}</span>
        <strong className="al-stat__value">{value}</strong>
      </div>
      <span className={`al-stat__icon${tone ? ` al-stat__icon--${tone}` : ''}`}>{icon}</span>
    </div>
  );
}

export function PaymentsSummary({ payments }: PaymentsSummaryProps) {
  const total = totalOf(payments);
  const average = payments.length > 0 ? total / payments.length : 0;

  return (
    <div className="al-stats">
      <StatTile label="إجمالي القيمة" value={formatCompact(total)} icon={<WalletIcon />} />
      <StatTile label="نقداً" value={formatCompact(totalOf(payments, PAYMENT_METHODS.cash))} icon={<CashIcon />} tone="gold" />
      <StatTile label="بطاقات" value={formatCompact(totalOf(payments, PAYMENT_METHODS.card))} icon={<CardIcon />} />
      <StatTile label="تحويلات" value={formatCompact(totalOf(payments, PAYMENT_METHODS.transfer))} icon={<TransferIcon />} tone="gold" />
      <StatTile label="عدد العمليات" value={String(payments.length)} icon={<HashIcon />} />
      <StatTile label="متوسط معاملة" value={formatMoney(average)} icon={<CalcIcon />} tone="rose" />
    </div>
  );
}

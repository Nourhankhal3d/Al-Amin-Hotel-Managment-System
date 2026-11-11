import { http, HttpResponse } from 'msw';
import { subManagerFinanceSeed } from '../data/subManagerFinanceSeed';

const API = '/api/v1';
const { chartDate, payments, expenses } = subManagerFinanceSeed;

function sumAmounts<T extends { amount: number }>(records: T[]): number {
  return records.reduce((total, record) => total + record.amount, 0);
}

function summarizeBy<T extends { amount: number }>(
  records: T[],
  key: keyof T,
): Array<{ id: string; amount: number }> {
  const amounts = new Map<string, number>();
  records.forEach((record) => {
    const id = String(record[key]);
    amounts.set(id, (amounts.get(id) ?? 0) + record.amount);
  });
  return Array.from(amounts, ([id, amount]) => ({ id, amount }));
}

function getSummary() {
  const revenueTotal = sumAmounts(payments);
  const expenseTotal = sumAmounts(expenses);
  const shiftHours = [8, 10, 12, 14, 16];

  return {
    chartDate,
    transactionCount: payments.length,
    expenseRecordCount: expenses.length,
    operationCount: payments.length + expenses.length,
    revenueTotal,
    expenseTotal,
    netAmount: revenueTotal - expenseTotal,
    refundedTotal: sumAmounts(payments.filter((payment) => payment.status === 'refunded')),
    chart: {
      points: shiftHours.map((hour) => sumAmounts(payments.filter((payment) => payment.hour <= hour))),
      hours: shiftHours,
    },
    paymentMethods: summarizeBy(payments, 'method'),
    expenseSources: summarizeBy(expenses, 'source'),
  };
}

export const subManagerDashboardHandlers = [
  http.get(`${API}/sub-manager/dashboard`, () => HttpResponse.json(getSummary())),
];
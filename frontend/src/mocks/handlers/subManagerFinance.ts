import { http, HttpResponse } from 'msw';
import { subManagerFinanceSeed } from '../data/subManagerFinanceSeed';
import { expenseDetails, paymentDetails } from '../data/subManagerFinanceDetails';
import { expenseDetailsEn, paymentDetailsEn } from '../data/subManagerFinanceDetails.en';
import type {
  ExpenseCategory,
  ExpenseRecord,
  ExpenseUpdate,
  PaymentRecord,
  PaymentStatus,
} from '../../features/submanager-finance/types/submanager-finance.types';

const API = '/api/v1';

const payments: PaymentRecord[] = subManagerFinanceSeed.payments.map((payment, index) => {
  const details = paymentDetails[index];
  const detailsEn = paymentDetailsEn[index];
  const idNumber = 8421 + index;
  return {
    id: `PAY-${idNumber}`,
    room: details.room,
    guest: details.guest,
    guestEn: detailsEn.guest,
    amount: payment.amount,
    method: payment.method as PaymentRecord['method'],
    date: subManagerFinanceSeed.chartDate,
    time: `${String(payment.hour).padStart(2, '0')}:${String(payment.minute).padStart(2, '0')}`,
    status: payment.status as PaymentStatus,
    reference: details.reference,
    employee: details.employee,
    employeeEn: detailsEn.employee,
    notes: details.notes,
    notesEn: detailsEn.notes,
  };
});

const expenses: ExpenseRecord[] = subManagerFinanceSeed.expenses.map((expense, index) => {
  const details = expenseDetails[index];
  const detailsEn = expenseDetailsEn[index];
  return {
    id: `EXP-${16 + index}`,
    category: expense.source as ExpenseCategory,
    amount: expense.amount,
    date: subManagerFinanceSeed.chartDate,
    time: details.time,
    notes: details.notes,
    notesEn: detailsEn.notes,
    recordedBy: details.recordedBy,
    recordedByEn: detailsEn.recordedBy,
  };
});

export const subManagerFinanceHandlers = [
  http.get(`${API}/sub-manager/finance`, () => HttpResponse.json({ payments, expenses })),
  http.patch(`${API}/sub-manager/finance/payments/:paymentId`, async ({ params, request }) => {
    const body = await request.json() as { status?: PaymentStatus };
    const payment = payments.find((record) => record.id === params.paymentId);
    if (!payment || !body.status || !['completed', 'pending', 'refunded', 'cancelled'].includes(body.status)) {
      return HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid payment status' } }, { status: 400 });
    }
    payment.status = body.status;
    return HttpResponse.json(payment);
  }),
  http.patch(`${API}/sub-manager/finance/expenses/:expenseId`, async ({ params, request }) => {
    const body = await request.json() as ExpenseUpdate;
    const expense = expenses.find((record) => record.id === params.expenseId);
    if (!expense || !Number.isFinite(body.amount) || body.amount <= 0 || !body.date || !body.time || !body.notes.trim()) {
      return HttpResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid expense details' } }, { status: 400 });
    }
    Object.assign(expense, {
      category: body.category,
      amount: body.amount,
      date: body.date,
      time: body.time,
      ...(body.notesEn === undefined ? { notes: body.notes.trim() } : { notesEn: body.notesEn.trim() }),
    });
    return HttpResponse.json(expense);
  }),
];
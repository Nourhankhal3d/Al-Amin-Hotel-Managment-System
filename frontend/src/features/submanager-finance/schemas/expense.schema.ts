import type { ExpenseCategory, ExpenseUpdate } from '../types/submanager-finance.types';

export interface ExpenseUpdateFormValues {
  category: ExpenseCategory;
  amount: string;
  date: string;
  time: string;
  notes: string;
}

export type ExpenseUpdateErrors = Partial<Record<keyof ExpenseUpdateFormValues, string>>;

export function validateExpenseUpdate(values: ExpenseUpdateFormValues): ExpenseUpdateErrors {
  const errors: ExpenseUpdateErrors = {};
  const amount = Number(values.amount);
  if (!values.amount.trim() || !Number.isFinite(amount) || amount <= 0) errors.amount = 'amountError';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || !Number.isFinite(Date.parse(`${values.date}T00:00:00`))) {
    errors.date = 'dateError';
  }
  const [hour, minute] = values.time.split(':').map(Number);
  if (!/^\d{2}:\d{2}$/.test(values.time) || hour > 23 || minute > 59) errors.time = 'timeError';
  if (!values.notes.trim()) errors.notes = 'notesError';
  return errors;
}

export function toExpenseUpdate(values: ExpenseUpdateFormValues): ExpenseUpdate {
  return {
    category: values.category,
    amount: Number(values.amount),
    date: values.date,
    time: values.time,
    notes: values.notes.trim(),
  };
}
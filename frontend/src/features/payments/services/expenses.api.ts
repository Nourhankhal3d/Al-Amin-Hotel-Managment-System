import { request } from '../../../core/api/apiClient';
import type { Paginated } from '../../../core/api/api.types';
import { newIdempotencyKey } from '../../../core/api/idempotency';

export type ExpenseCategory =
  | 'electricity'
  | 'water'
  | 'maintenance_supplies'
  | 'cleaning_supplies'
  | 'internet'
  | 'emergency'
  | 'other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'electricity',
  'water',
  'maintenance_supplies',
  'cleaning_supplies',
  'internet',
  'emergency',
  'other',
];

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  notes: string | null;
  recordedAt: string;
}

interface ApiExpense {
  expense_id: string;
  staff_id: string;
  shift_id: string;
  category: ExpenseCategory;
  amount: number;
  notes: string | null;
  expense_datetime: string;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amount: number;
  notes?: string;
}

const EXPENSES_FETCH_LIMIT = 100;

function mapApiExpense(api: ApiExpense): Expense {
  return {
    id: String(api.expense_id),
    category: api.category,
    amount: api.amount,
    notes: api.notes ?? null,
    recordedAt: api.expense_datetime,
  };
}

/** GET /expenses: only the expenses of the caller's current shift */
export async function getExpenses(): Promise<Expense[]> {
  const response = await request<Paginated<ApiExpense>>('/expenses', {
    params: { page: 1, limit: EXPENSES_FETCH_LIMIT },
  });
  return response.data.map(mapApiExpense);
}

/** POST /expenses: the server sets the staff member, the shift and the time */
export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const created = await request<ApiExpense>('/expenses', {
    method: 'POST',
    body: input,
    idempotencyKey: newIdempotencyKey(),
  });
  return mapApiExpense(created);
}
export type PaymentMethod = 'instapay' | 'cash' | 'vodafone_cash';
export type PaymentStatus = 'completed' | 'pending' | 'refunded' | 'cancelled';
export type ExpenseCategory =
  | 'cleaning_supplies'
  | 'maintenance_supplies'
  | 'electricity'
  | 'emergency';

export interface PaymentRecord {
  id: string;
  room: string;
  guest: string;
  guestEn?: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  time: string;
  status: PaymentStatus;
  reference: string;
  employee: string;
  employeeEn?: string;
  notes: string;
  notesEn?: string;
  // TODO confirm with backend: identifiers, status values, and shift timestamp fields.
}

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  time: string;
  notes: string;
  notesEn?: string;
  recordedBy: string;
  recordedByEn?: string;
  // TODO confirm with backend: expense category values and editable fields.
}

export interface SubManagerFinanceData {
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
}

export interface ExpenseUpdate {
  category: ExpenseCategory;
  amount: number;
  date: string;
  time: string;
  notes: string;
  notesEn?: string;
}
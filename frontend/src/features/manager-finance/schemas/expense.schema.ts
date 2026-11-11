import { z } from 'zod';

export const expenseEditSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  notes: z.string().optional(),
});

export type ExpenseEditFormData = z.infer<typeof expenseEditSchema>;

export interface ExpenseEditFormErrors {
  amount?: string;
  category?: string;
  notes?: string;
}

export interface ValidateExpenseEditResult {
  isValid: boolean;
  errors: ExpenseEditFormErrors;
  data?: ExpenseEditFormData;
}

export function validateExpenseEdit(
  input: {
    amount: string | number;
    category: string;
    notes?: string;
  },
  t: (key: string) => string,
): ValidateExpenseEditResult {
  const errors: ExpenseEditFormErrors = {};

  // 1. Amount validation
  const rawAmount = typeof input.amount === 'string' ? input.amount.trim() : String(input.amount);
  const numAmount = Number(rawAmount);

  if (!rawAmount || Number.isNaN(numAmount)) {
    errors.amount = t('manager.finance.expenseDrawer.errors.amountRequired');
  } else if (numAmount <= 0) {
    errors.amount = t('manager.finance.expenseDrawer.errors.amountPositive');
  }

  // 2. Category validation
  const cat = input.category ? input.category.trim() : '';
  if (!cat || cat === 'ALL') {
    errors.category = t('manager.finance.expenseDrawer.errors.categoryRequired');
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    data: isValid
      ? {
          amount: numAmount,
          category: cat,
          notes: input.notes?.trim() || '',
        }
      : undefined,
  };
}

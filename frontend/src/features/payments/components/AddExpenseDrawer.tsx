import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { useToast } from '../../../components/common/toast.context';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { getTranslation, type Language } from '../../../core/i18n';
import { createExpense, EXPENSE_CATEGORIES } from '../services/expenses.api';
import type { ExpenseCategory } from '../services/expenses.api';
import { formatAmount, formatPaymentTime } from '../utils/paymentsFormat';
import './AddPaymentDrawer.css';

const FORM_ID = 'add-expense-form';
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

type Field = 'category' | 'amount';

/** Accept Arabic-Indic digits and the Arabic decimal mark as well as plain digits */
function toLatinDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/٫/g, '.');
}

interface AddExpenseDrawerProps {
  open: boolean;
  language: Language;
  onClose: () => void;
}

/** "Add expense" form. The parent remounts it (via `key`) each time it opens, so it always starts empty. */
export function AddExpenseDrawer({ open, language, onClose }: AddExpenseDrawerProps) {
  const t = (key: string) => getTranslation(language, key);
  const toast = useToast();
  const queryClient = useQueryClient();
  const baseId = useId();
  const fieldId = (field: string) => `${baseId}-${field}`;

  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [openedAt] = useState(() => new Date().toISOString());

  const mutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      void queryClient.invalidateQueries({ queryKey: ['shift-handover'] });
      void queryClient.invalidateQueries({ queryKey: ['shift-report'] });
    },
  });
  const saving = mutation.isPending;

  const clearError = (field: Field) => setErrors((current) => ({ ...current, [field]: undefined }));

  function validate(): Partial<Record<Field, string>> {
    const next: Partial<Record<Field, string>> = {};
    if (!category) next.category = t('paymentsPage.expenseForm.errors.category');
    const text = amount.trim();
    if (!AMOUNT_PATTERN.test(text) || Number(text) <= 0) next.amount = t('paymentsPage.expenseForm.errors.amount');
    return next;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    const firstInvalid = (['category', 'amount'] as Field[]).find((field) => nextErrors[field]);
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    try {
      const result = await mutation.mutateAsync({
        category: category as ExpenseCategory,
        amount: Number(amount.trim()),
        notes: notes.trim() || undefined,
      });
      toast.showToast(
        t('paymentsPage.expenseForm.success').replace('{amount}', formatAmount(result.amount, language)),
        'success',
      );
      onClose();
    } catch (error) {
      toast.showToast(getErrorMessage(error, language), 'error');
    }
  }

  return (
    <Drawer
      open={open}
      title={t('paymentsPage.expenseForm.title')}
      eyebrow={t('paymentsPage.expenseForm.eyebrow')}
      closeLabel={t('paymentsPage.expenseForm.close')}
      onClose={onClose}
      className="add-payment-drawer"
      footer={(
        <div className="payment-form__footer">
          <Button variant="secondary" onClick={onClose} disabled={saving}>{t('paymentsPage.expenseForm.cancel')}</Button>
          <Button type="submit" form={FORM_ID} disabled={saving}>{t('paymentsPage.expenseForm.submit')}</Button>
        </div>
      )}
    >
      <form id={FORM_ID} className="payment-form" onSubmit={(event) => { void handleSubmit(event); }} noValidate>
        <div className="payment-form__row">
          <Select
            id={fieldId('category')}
            label={t('paymentsPage.expenseForm.category')}
            value={category}
            placeholder={t('paymentsPage.expenseForm.categoryPlaceholder')}
            options={EXPENSE_CATEGORIES.map((item) => ({ value: item, label: t(`paymentsPage.expenses.categories.${item}`) }))}
            onChange={(next) => { setCategory(next as ExpenseCategory); clearError('category'); }}
            error={errors.category}
            disabled={saving}
          />

          <label className="payment-form__field">
            <span>{t('paymentsPage.expenseForm.amount')}</span>
            <input
              id={fieldId('amount')}
              type="text"
              inputMode="decimal"
              dir="ltr"
              placeholder={t('paymentsPage.expenseForm.amountPlaceholder')}
              value={amount}
              disabled={saving}
              aria-invalid={errors.amount ? true : undefined}
              className={errors.amount ? 'payment-form__control--error' : undefined}
              onChange={(event) => { setAmount(toLatinDigits(event.target.value)); clearError('amount'); }}
            />
            {errors.amount && <small className="payment-form__error">{errors.amount}</small>}
          </label>
        </div>

        <label className="payment-form__field">
          <span>{t('paymentsPage.expenseForm.time')}</span>
          <input
            value={t('paymentsPage.expenseForm.timeNow').replace('{time}', formatPaymentTime(openedAt, language))}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
          />
        </label>

        <label className="payment-form__field">
          <span>{t('paymentsPage.expenseForm.notes')}</span>
          <textarea
            rows={4}
            placeholder={t('paymentsPage.expenseForm.notesPlaceholder')}
            value={notes}
            disabled={saving}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <p className="payment-form__info">
          <Wallet aria-hidden="true" />
          {t('paymentsPage.expenseForm.info')}
        </p>
      </form>
    </Drawer>
  );
}
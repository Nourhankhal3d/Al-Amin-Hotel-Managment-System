import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { InfoTile } from '../../../components/ui/InfoTile';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatClock, formatCurrency } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import {
  toExpenseUpdate,
  validateExpenseUpdate,
  type ExpenseUpdateErrors,
  type ExpenseUpdateFormValues,
} from '../schemas/expense.schema';
import { ExpenseCategory, ExpenseRecord, ExpenseUpdate } from '../types/submanager-finance.types';
import './ExpenseDrawer.css';

interface ExpenseDrawerProps {
  expense: ExpenseRecord;
  busy: boolean;
  onClose: () => void;
  onSave: (values: ExpenseUpdate) => Promise<void>;
}

type ExpenseField = keyof ExpenseUpdateFormValues;

function categoryTone(category: ExpenseCategory): 'success' | 'warning' | 'danger' | 'neutral' {
  if (category === 'cleaning_supplies') return 'success';
  if (category === 'maintenance_supplies') return 'warning';
  if (category === 'electricity') return 'neutral';
  return 'danger';
}

export function ExpenseDrawer({ expense, busy, onClose, onSave }: ExpenseDrawerProps) {
  const { language, t } = useLanguage();
  const notes = language === 'en' ? expense.notesEn ?? expense.notes : expense.notes;
  const recordedBy = language === 'en' ? expense.recordedByEn ?? expense.recordedBy : expense.recordedBy;
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<ExpenseUpdateFormValues>({
    category: expense.category,
    amount: String(expense.amount),
    date: expense.date,
    time: expense.time,
    notes,
  });
  const [errors, setErrors] = useState<ExpenseUpdateErrors>({});
  const submitInProgress = useRef(false);

  useEffect(() => {
    setEditing(false);
    setValues({
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date,
      time: expense.time,
      notes,
    });
    setErrors({});
  }, [expense, notes]);

  const categories: Array<{ value: ExpenseCategory; label: string }> = [
    { value: 'cleaning_supplies', label: t('submanager.dashboard.expenseSources.cleaning_supplies') },
    { value: 'maintenance_supplies', label: t('submanager.dashboard.expenseSources.maintenance_supplies') },
    { value: 'electricity', label: t('submanager.dashboard.expenseSources.electricity') },
    { value: 'emergency', label: t('submanager.dashboard.expenseSources.emergency') },
  ];
  const categoryLabel = t(`submanager.dashboard.expenseSources.${expense.category}`);

  const updateField = (field: ExpenseField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitInProgress.current) return;
    const validationErrors = validateExpenseUpdate(values);
    if (Object.keys(validationErrors).length > 0) {
      const localizedErrors = Object.fromEntries(
        Object.entries(validationErrors).map(([field, key]) => [field, t(`submanager.finance.details.${key}`)]),
      ) as ExpenseUpdateErrors;
      setErrors(localizedErrors);
      return;
    }
    submitInProgress.current = true;
    void onSave(toExpenseUpdate(values)).finally(() => {
      submitInProgress.current = false;
    });
  };

  return (
    <Drawer
      open
      title={expense.id}
      eyebrow={t('submanager.finance.details.expenseEyebrow')}
      closeLabel={t('submanager.finance.details.close')}
      onClose={onClose}
      className="finance-expense-drawer"
      footer={editing ? (
        <>
          <Button variant="secondary" disabled={busy} onClick={() => { setEditing(false); setErrors({}); }}>
            {t('submanager.finance.details.cancelEdit')}
          </Button>
          <Button type="submit" form="finance-expense-edit-form" disabled={busy}>
            {t('submanager.finance.details.saveEdit')}
          </Button>
        </>
      ) : (
        <>
          <Button variant="secondary" onClick={onClose}>{t('submanager.finance.details.close')}</Button>
          <Button onClick={() => setEditing(true)}>{t('submanager.finance.details.edit')}</Button>
        </>
      )}
    >
      <div className="finance-expense-drawer__content" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <section className="drawer-details__summary finance-expense-drawer__amount">
          <div className="drawer-details__summary-text">
            <span>{t('submanager.finance.details.amount')}</span>
            <strong>{formatCurrency(expense.amount, language)}</strong>
            <span><Badge tone={categoryTone(expense.category)}>{categoryLabel}</Badge></span>
          </div>
        </section>

        {editing ? (
          <form id="finance-expense-edit-form" className="finance-expense-drawer__form" onSubmit={submit} noValidate>
            <Select
              label={t('submanager.finance.details.category')}
              value={values.category}
              options={categories}
              onChange={(value) => updateField('category', value)}
              error={errors.category}
            />
            <label className="finance-expense-drawer__field">
              <span>{t('submanager.finance.details.amount')}</span>
              <Input
                type="number"
                min="0.01"
                step="1"
                value={values.amount}
                placeholder={t('submanager.finance.details.amountPlaceholder')}
                aria-invalid={Boolean(errors.amount)}
                onChange={(event) => updateField('amount', event.target.value)}
              />
              {errors.amount && <small>{errors.amount}</small>}
            </label>
            <label className="finance-expense-drawer__field">
              <span>{t('submanager.finance.details.date')}</span>
              <Input
                type="date"
                value={values.date}
                aria-label={t('submanager.finance.details.datePlaceholder')}
                aria-invalid={Boolean(errors.date)}
                onChange={(event) => updateField('date', event.target.value)}
              />
              {errors.date && <small>{errors.date}</small>}
            </label>
            <label className="finance-expense-drawer__field">
              <span>{t('submanager.finance.details.time')}</span>
              <Input
                type="time"
                value={values.time}
                aria-label={t('submanager.finance.details.timePlaceholder')}
                aria-invalid={Boolean(errors.time)}
                onChange={(event) => updateField('time', event.target.value)}
              />
              {errors.time && <small>{errors.time}</small>}
            </label>
            <label className="finance-expense-drawer__field">
              <span>{t('submanager.finance.details.notes')}</span>
              <Input
                value={values.notes}
                placeholder={t('submanager.finance.details.notesPlaceholder')}
                aria-invalid={Boolean(errors.notes)}
                onChange={(event) => updateField('notes', event.target.value)}
              />
              {errors.notes && <small>{errors.notes}</small>}
            </label>
          </form>
        ) : (
          <>
            <div className="drawer-details__grid">
              <InfoTile label={t('submanager.finance.details.category')} value={categoryLabel} />
              <InfoTile label={t('submanager.finance.details.date')} value={formatDate(new Date(`${expense.date}T12:00:00`), language)} />
              <InfoTile label={t('submanager.finance.details.time')} value={formatClock(new Date(`${expense.date}T${expense.time}:00`), language)} />
              <InfoTile label={t('submanager.finance.details.recordedBy')} value={recordedBy} />
            </div>
            <section className="finance-expense-drawer__notes">
              <h3 className="drawer-details__heading">{t('submanager.finance.details.notes')}</h3>
              <p className="drawer-details__box">{notes}</p>
            </section>
          </>
        )}
      </div>
    </Drawer>
  );
}
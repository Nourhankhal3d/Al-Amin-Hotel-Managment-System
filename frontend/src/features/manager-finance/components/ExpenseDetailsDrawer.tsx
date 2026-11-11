import { useState, useEffect } from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { InfoTile } from '../../../components/ui/InfoTile';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/ToastContext';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import { useUpdateExpense } from '../hooks/useUpdateExpense';
import {
  validateExpenseEdit,
  type ExpenseEditFormErrors,
} from '../schemas/expense.schema';
import type { FinanceExpense } from '../types/manager-finance.types';
import type { ExpenseCategoryCode } from '../constants/finance.constants';
import './ExpenseDetailsDrawer.css';

export interface ExpenseDetailsDrawerProps {
  expense: FinanceExpense | null;
  open: boolean;
  onClose: () => void;
  onExpenseUpdated?: () => void;
}

export function ExpenseDetailsDrawer({
  expense,
  open,
  onClose,
  onExpenseUpdated,
}: ExpenseDetailsDrawerProps) {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const updateMutation = useUpdateExpense();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('CLEANING');
  const [editNotes, setEditNotes] = useState<string>('');
  const [errors, setErrors] = useState<ExpenseEditFormErrors>({});

  // Sync state whenever the selected expense changes or drawer opens
  useEffect(() => {
    if (expense) {
      setEditAmount(String(expense.amount));
      const catCode =
        expense.category === 'cleaning'
          ? 'CLEANING'
          : expense.category === 'maintenance'
            ? 'MAINTENANCE'
            : expense.category === 'utilities'
              ? 'UTILITIES'
              : expense.category === 'emergency'
                ? 'EMERGENCY'
                : 'CLEANING';
      setEditCategory(catCode);
      setEditNotes(expense.notes || '');
      setErrors({});
      setIsEditing(false);
    }
  }, [expense, open]);

  if (!expense) return null;

  const categoryOptions: SelectOption[] = [
    { value: 'CLEANING', label: t('manager.finance.categories.cleaning') },
    { value: 'MAINTENANCE', label: t('manager.finance.categories.maintenance') },
    { value: 'UTILITIES', label: t('manager.finance.categories.utilities') },
    { value: 'EMERGENCY', label: t('manager.finance.categories.emergency') },
  ];

  const handleSaveEdit = async () => {
    const validation = validateExpenseEdit(
      {
        amount: editAmount,
        category: editCategory,
        notes: editNotes,
      },
      t,
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        expenseId: expense.id || expense.expenseNumber,
        payload: {
          amount: Number(editAmount),
          category: editCategory as ExpenseCategoryCode,
          notes: editNotes.trim(),
        },
      });

      showToast(t('manager.finance.expenseDrawer.toastSuccess'), 'success');
      setIsEditing(false);
      onExpenseUpdated?.();
    } catch {
      showToast(t('manager.finance.expenseDrawer.toastError'), 'error');
    }
  };

  const currencySymbol = language === 'ar' ? 'ج.م' : 'EGP';

  const footerActions = isEditing ? (
    <div className="expense-drawer__footer-actions">
      <Button
        variant="primary"
        onClick={handleSaveEdit}
        disabled={updateMutation.isPending}
        className="expense-drawer__primary-btn"
      >
        {updateMutation.isPending
          ? t('manager.finance.expenseDrawer.saving')
          : t('manager.finance.expenseDrawer.saveChanges')}
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          setIsEditing(false);
          setErrors({});
        }}
        disabled={updateMutation.isPending}
        className="expense-drawer__secondary-btn"
      >
        {t('manager.finance.expenseDrawer.cancel')}
      </Button>
    </div>
  ) : (
    <div className="expense-drawer__footer-actions">
      <Button
        variant="primary"
        onClick={() => setIsEditing(true)}
        className="expense-drawer__primary-btn"
      >
        {t('manager.finance.expenseDrawer.editRecord')}
      </Button>
      <Button
        variant="secondary"
        onClick={onClose}
        className="expense-drawer__secondary-btn"
      >
        {t('manager.finance.expenseDrawer.close')}
      </Button>
    </div>
  );

  const drawerEyebrow = isEditing
    ? t('manager.finance.expenseDrawer.editEyebrow')
    : t('manager.finance.expenseDrawer.eyebrow');

  const drawerTitle = isEditing
    ? t('manager.finance.expenseDrawer.editTitle').replace(
        '{id}',
        expense.expenseNumber,
      )
    : expense.expenseNumber;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={drawerTitle}
      eyebrow={drawerEyebrow}
      closeLabel={t('manager.finance.expenseDrawer.close')}
      footer={footerActions}
      className="expense-details-drawer"
    >
      <div className="expense-drawer__body">
        {isEditing ? (
          /* ================= EDIT MODE FORM ================= */
          <div className="expense-drawer__edit-form">
            {/* Amount Field */}
            <div className="expense-drawer__form-group">
              <label
                className="expense-drawer__form-label"
                htmlFor="expense-edit-amount"
              >
                {t('manager.finance.expenseDrawer.amountLabel')}
              </label>
              <Input
                id="expense-edit-amount"
                type="number"
                min="0.01"
                step="any"
                value={editAmount}
                onChange={(e) => {
                  setEditAmount(e.target.value);
                  if (errors.amount) {
                    setErrors((prev) => ({ ...prev, amount: undefined }));
                  }
                }}
                className={errors.amount ? 'expense-drawer__input--error' : ''}
                aria-invalid={!!errors.amount}
              />
              {errors.amount && (
                <span className="expense-drawer__field-error" role="alert">
                  {errors.amount}
                </span>
              )}
            </div>

            {/* Category Field */}
            <div className="expense-drawer__form-group">
              <label className="expense-drawer__form-label">
                {t('manager.finance.expenseDrawer.categoryLabel')}
              </label>
              <Select
                value={editCategory}
                options={categoryOptions}
                onChange={(val) => {
                  setEditCategory(val);
                  if (errors.category) {
                    setErrors((prev) => ({ ...prev, category: undefined }));
                  }
                }}
              />
              {errors.category && (
                <span className="expense-drawer__field-error" role="alert">
                  {errors.category}
                </span>
              )}
            </div>

            {/* Notes Field */}
            <div className="expense-drawer__form-group">
              <label
                className="expense-drawer__form-label"
                htmlFor="expense-edit-notes"
              >
                {t('manager.finance.expenseDrawer.notesLabel')}
              </label>
              <textarea
                id="expense-edit-notes"
                className="expense-drawer__textarea"
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>
        ) : (
          /* ================= VIEW MODE ================= */
          <>
            {/* 1. Amount Card (Gold-tinted with category chip) */}
            <div className="expense-drawer__amount-card">
              <span className="expense-drawer__amount-label">
                {t('manager.finance.expenseDrawer.amountExpensed')}
              </span>
              <div className="expense-drawer__amount-val-wrapper">
                <strong className="expense-drawer__amount-val">
                  {formatNumber(expense.amount, language)}
                </strong>
                <span className="expense-drawer__amount-currency">
                  {currencySymbol}
                </span>
              </div>
              <div className="expense-drawer__category-pill">
                <span>{expense.categoryLabel}</span>
              </div>
            </div>

            {/* 2. 4 InfoTiles in 2-column grid */}
            <div className="expense-drawer__tiles-grid">
              <InfoTile
                label={t('manager.finance.expenseDrawer.date')}
                value={formatDate(expense.date, language) || expense.date}
                variant="muted"
              />
              <InfoTile
                label={t('manager.finance.expenseDrawer.time')}
                value={expense.time}
                variant="muted"
              />
              <InfoTile
                label={t('manager.finance.expenseDrawer.recordedBy')}
                value={expense.recordedByName || 'س'}
                variant="muted"
              />
              <InfoTile
                label={t('manager.finance.expenseDrawer.category')}
                value={expense.categoryLabel}
                variant="muted"
              />
            </div>

            {/* 3. Notes Section */}
            <div className="expense-drawer__section">
              <label className="expense-drawer__section-title">
                {t('manager.finance.expenseDrawer.notes')}
              </label>
              <div className="expense-drawer__notes-box">
                {expense.notes || t('manager.finance.expenseDrawer.noNotes')}
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}

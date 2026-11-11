import { useState, useEffect } from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { InfoTile } from '../../../components/ui/InfoTile';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/ToastContext';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { useUpdatePaymentStatus } from '../hooks/useUpdatePaymentStatus';
import type { FinanceTransaction } from '../types/manager-finance.types';
import type { TransactionStatusCode } from '../constants/finance.constants';
import './PaymentDetailsDrawer.css';

export interface PaymentDetailsDrawerProps {
  transaction: FinanceTransaction | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export function PaymentDetailsDrawer({
  transaction,
  open,
  onClose,
  onStatusUpdated,
}: PaymentDetailsDrawerProps) {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const updateMutation = useUpdatePaymentStatus();

  const [selectedStatus, setSelectedStatus] = useState<string>('COMPLETED');

  // Sync internal selected status when transaction opens or changes
  useEffect(() => {
    if (transaction) {
      setSelectedStatus(transaction.status.toUpperCase());
    }
  }, [transaction]);

  if (!transaction) return null;

  const statusOptions: SelectOption[] = [
    { value: 'COMPLETED', label: t('manager.finance.statuses.completed') },
    { value: 'PENDING', label: t('manager.finance.statuses.pending') },
    { value: 'REFUNDED', label: t('manager.finance.statuses.refunded') },
    { value: 'CANCELLED', label: t('manager.finance.statuses.cancelled') },
  ];

  const handleSaveStatus = async () => {
    try {
      await updateMutation.mutateAsync({
        paymentId: transaction.id || transaction.transactionNumber,
        status: selectedStatus as TransactionStatusCode,
        reason: 'تحديث من شاشة تفاصيل الدفعة',
      });
      showToast(t('manager.finance.paymentDrawer.toastSuccess'), 'success');
      onStatusUpdated?.();
      onClose();
    } catch {
      showToast(t('manager.finance.paymentDrawer.toastError'), 'error');
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') {
      return (
        <Badge tone="success">{t('manager.finance.statuses.completed')}</Badge>
      );
    }
    if (s === 'pending') {
      return (
        <Badge tone="warning">{t('manager.finance.statuses.pending')}</Badge>
      );
    }
    if (s === 'refunded') {
      return (
        <Badge tone="danger">{t('manager.finance.statuses.refunded')}</Badge>
      );
    }
    return (
      <Badge tone="neutral">{t('manager.finance.statuses.cancelled')}</Badge>
    );
  };

  const roomNum = Number(transaction.roomNumber);
  const displayRoom = !Number.isNaN(roomNum)
    ? formatNumber(roomNum, language)
    : transaction.roomNumber;

  const referenceNumber =
    transaction.refundRequestId ||
    `REF-${transaction.transactionNumber.replace(/\D/g, '') || '20618'}`;

  const footerActions = (
    <div className="payment-drawer__footer-actions">
      <Button
        variant="primary"
        onClick={handleSaveStatus}
        disabled={updateMutation.isPending}
        className="payment-drawer__save-btn"
      >
        {updateMutation.isPending
          ? t('manager.finance.paymentDrawer.saving')
          : t('manager.finance.paymentDrawer.saveStatus')}
      </Button>
      <Button
        variant="secondary"
        onClick={onClose}
        className="payment-drawer__close-btn"
      >
        {t('manager.finance.paymentDrawer.close')}
      </Button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={transaction.transactionNumber}
      eyebrow={t('manager.finance.paymentDrawer.eyebrow')}
      closeLabel={t('manager.finance.paymentDrawer.close')}
      footer={footerActions}
      className="payment-details-drawer"
    >
      <div className="payment-drawer__body">
        {/* 1. Received Amount Card */}
        <div className="payment-drawer__amount-card">
          <span className="payment-drawer__amount-label">
            {t('manager.finance.paymentDrawer.amountReceived')}
          </span>
          <strong className="payment-drawer__amount-val">
            {formatCurrency(transaction.amount, language)}
          </strong>
          <div className="payment-drawer__status-pill">
            {renderStatusBadge(transaction.status)}
          </div>
        </div>

        {/* 2. 6 InfoTiles in 2-column grid */}
        <div className="payment-drawer__tiles-grid">
          <InfoTile
            label={t('manager.finance.paymentDrawer.roomNumber')}
            value={displayRoom}
            variant="muted"
          />
          <InfoTile
            label={t('manager.finance.paymentDrawer.guestName')}
            value={transaction.guestName}
            variant="muted"
          />
          <InfoTile
            label={t('manager.finance.paymentDrawer.paymentMethod')}
            value={transaction.methodLabel || t(`manager.finance.methods.${transaction.method}`)}
            variant="muted"
          />
          <InfoTile
            label={t('manager.finance.paymentDrawer.timeReceived')}
            value={transaction.time}
            variant="muted"
          />
          <InfoTile
            label={t('manager.finance.paymentDrawer.referenceNumber')}
            value={referenceNumber}
            variant="muted"
          />
          <InfoTile
            label={t('manager.finance.paymentDrawer.staffMember')}
            value={transaction.staffName || 'كريم نبيل'}
            variant="muted"
          />
        </div>

        {/* 3. Notes Section */}
        <div className="payment-drawer__section">
          <label className="payment-drawer__section-title">
            {t('manager.finance.paymentDrawer.notes')}
          </label>
          <div className="payment-drawer__notes-box">
            {transaction.notes || t('manager.finance.paymentDrawer.noNotes')}
          </div>
        </div>

        {/* 4. Update Payment Status */}
        <div className="payment-drawer__section">
          <label className="payment-drawer__section-title">
            {t('manager.finance.paymentDrawer.updateStatus')}
          </label>
          <Select
            value={selectedStatus}
            options={statusOptions}
            onChange={setSelectedStatus}
          />
        </div>
      </div>
    </Drawer>
  );
}

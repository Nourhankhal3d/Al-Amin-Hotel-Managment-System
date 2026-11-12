import { useEffect, useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { InfoTile } from '../../../components/ui/InfoTile';
import { Select } from '../../../components/ui/Select';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatClock, formatCurrency } from '../../../utils/format';
import { PaymentRecord, PaymentStatus } from '../types/submanager-finance.types';
import './PaymentDrawer.css';

interface PaymentDrawerProps {
  payment: PaymentRecord;
  busy: boolean;
  onClose: () => void;
  onSave: (status: PaymentStatus) => Promise<void>;
}

function statusTone(status: PaymentStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'completed') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'refunded') return 'danger';
  return 'neutral';
}

export function PaymentDrawer({ payment, busy, onClose, onSave }: PaymentDrawerProps) {
  const { language, t } = useLanguage();
  const [status, setStatus] = useState(payment.status);

  useEffect(() => setStatus(payment.status), [payment.id, payment.status]);

  const statusOptions: Array<{ value: PaymentStatus; label: string }> = [
    { value: 'completed', label: t('submanager.finance.status.completed') },
    { value: 'pending', label: t('submanager.finance.status.pending') },
    { value: 'refunded', label: t('submanager.finance.status.refunded') },
    { value: 'cancelled', label: t('submanager.finance.status.cancelled') },
  ];
  const method = t(`submanager.dashboard.paymentMethods.${payment.method}`);
  const guestName = language === 'en' ? payment.guestEn ?? payment.guest : payment.guest;
  const employeeName = language === 'en' ? payment.employeeEn ?? payment.employee : payment.employee;
  const notes = language === 'en' ? payment.notesEn ?? payment.notes : payment.notes;

  return (
    <Drawer
      open
      title={payment.id}
      eyebrow={t('submanager.finance.details.paymentEyebrow')}
      closeLabel={t('submanager.finance.details.close')}
      onClose={onClose}
      className="finance-payment-drawer"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>{t('submanager.finance.details.close')}</Button>
          <Button disabled={busy} onClick={() => { void onSave(status); }}>
            {t('submanager.finance.details.saveStatus')}
          </Button>
        </>
      )}
    >
      <div className="finance-payment-drawer__content" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <section className="drawer-details__summary finance-payment-drawer__amount">
          <div className="drawer-details__summary-text">
            <span>{t('submanager.finance.details.amount')}</span>
            <strong>{formatCurrency(payment.amount, language)}</strong>
            <span><Badge tone={statusTone(payment.status)}>{t(`submanager.finance.status.${payment.status}`)}</Badge></span>
          </div>
        </section>

        <div className="drawer-details__grid">
          <InfoTile label={t('submanager.finance.details.room')} value={payment.room} />
          <InfoTile label={t('submanager.finance.details.guest')} value={guestName} />
          <InfoTile label={t('submanager.finance.details.method')} value={method} />
          <InfoTile
            label={t('submanager.finance.details.time')}
            value={formatClock(new Date(`${payment.date}T${payment.time}:00`), language)}
          />
          <InfoTile label={t('submanager.finance.details.reference')} value={payment.reference} />
          <InfoTile label={t('submanager.finance.details.employee')} value={employeeName} />
        </div>

        <section className="finance-payment-drawer__notes">
          <h3 className="drawer-details__heading">{t('submanager.finance.details.notes')}</h3>
          <p className="drawer-details__box">{notes}</p>
        </section>

        <div className="finance-payment-drawer__status">
          <Select
            label={t('submanager.finance.details.statusUpdate')}
            value={status}
            options={statusOptions}
            onChange={(value) => setStatus(value as PaymentStatus)}
          />
        </div>
      </div>
    </Drawer>
  );
}
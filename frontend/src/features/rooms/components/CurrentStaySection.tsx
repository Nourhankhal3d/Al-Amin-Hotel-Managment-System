import { useRef, useState } from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/ToastContext';
import type { Language } from '../../../core/i18n';
import { getTranslation } from '../../../core/i18n';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { formatDate } from '../../../utils/date';
import { formatCurrency } from '../../../utils/format';
import { useCheckOut, useCurrentStay, useRecordPayment } from '../services/useRooms';
import type { PaymentMethod, Room } from '../types/room.types';
import './CurrentStaySection.css';

interface CurrentStaySectionProps {
  room: Room;
  language: Language;
  onCheckedOut: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'instapay', 'vodafone_cash'];
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

function parseAmount(raw: string): number {
  const cleaned = toLatinDigits(raw).replace(/[,\s]/g, '').replace('٫', '.');
  return cleaned === '' ? Number.NaN : Number(cleaned);
}

export function CurrentStaySection({ room, language, onCheckedOut }: CurrentStaySectionProps) {
  const t = (key: string) => getTranslation(language, key);
  const toast = useToast();
  const stayQuery = useCurrentStay(room.id, true);
  const recordPayment = useRecordPayment();
  const checkOut = useCheckOut();

  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [amount, setAmount] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const paymentKey = useRef(crypto.randomUUID());
  const checkOutKey = useRef(crypto.randomUUID());

  const stay = stayQuery.data;
  if (stayQuery.isPending) return <p className="current-stay__note">{t('rooms.stay.loading')}</p>;
  if (stayQuery.isError) return <p className="current-stay__note">{getErrorMessage(stayQuery.error, language)}</p>;
  if (!stay) return <p className="current-stay__note">{t('rooms.stay.none')}</p>;

  const remaining = stay.remainingAmount;
  const methodOptions = PAYMENT_METHODS.map((value) => ({ value, label: t(`rooms.drawer.paymentMethod.${value}`) }));

  function touchPayment() {
    paymentKey.current = crypto.randomUUID();
    setFieldError(null);
    setServerError(null);
  }

  async function submitPayment() {
    const value = parseAmount(amount);
    if (!method) { setFieldError(t('rooms.walkIn.errors.method')); return; }
    if (!Number.isFinite(value) || value <= 0 || Math.round(value * 100) / 100 !== value) {
      setFieldError(t('rooms.walkIn.errors.amount'));
      return;
    }
    if (Math.round(value * 100) > Math.round(remaining * 100)) {
      setFieldError(t('rooms.walkIn.errors.amountHigh').replace('{max}', formatCurrency(remaining, language)));
      return;
    }
    try {
      await recordPayment.mutateAsync({
        reservationId: stay!.reservationId,
        amount: value,
        method,
        idempotencyKey: paymentKey.current,
      });
      toast.notify(t('rooms.stay.paymentSaved'), 'success');
      setAmount('');
      setMethod('');
      paymentKey.current = crypto.randomUUID();
    } catch (error) {
      setServerError(getErrorMessage(error, language));
    }
  }

  async function submitCheckOut() {
    setServerError(null);
    try {
      await checkOut.mutateAsync({ reservationId: stay!.reservationId, idempotencyKey: checkOutKey.current });
      toast.notify(t('rooms.stay.checkedOut'), 'success');
      onCheckedOut();
    } catch (error) {
      setConfirming(false);
      checkOutKey.current = crypto.randomUUID();
      setServerError(getErrorMessage(error, language));
    }
  }

  const busy = recordPayment.isPending || checkOut.isPending;

  return (
    <section className="current-stay">
      <h3>{t('rooms.stay.title')}</h3>

      {serverError && (
        <div className="current-stay__error" role="alert">
          <AlertTriangle aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="current-stay__summary">
        {room.guestName && (
          <div><span>{t('rooms.stay.guest')}</span><strong>{room.guestName}</strong></div>
        )}
        <div><span>{t('rooms.walkIn.checkIn')}</span><strong>{formatDate(stay.checkIn, language)}</strong></div>
        <div><span>{t('rooms.walkIn.checkOut')}</span><strong>{formatDate(stay.checkOut, language)}</strong></div>
        <div><span>{t('rooms.stay.total')}</span><strong>{formatCurrency(stay.totalAmount, language)}</strong></div>
        <div><span>{t('rooms.stay.paid')}</span><strong>{formatCurrency(stay.paidAmount, language)}</strong></div>
        <div className="current-stay__remaining">
          <span>{t('rooms.stay.remaining')}</span><strong>{formatCurrency(remaining, language)}</strong>
        </div>
      </div>

      {remaining > 0 && (
        <div className="current-stay__payment">
          <h4>{t('rooms.stay.recordPayment')}</h4>
          <div className="current-stay__pair">
            <Select
              label={t('rooms.drawer.paymentMethod.label')}
              value={method}
              placeholder={t('rooms.walkIn.methodPlaceholder')}
              options={methodOptions}
              onChange={(value) => { touchPayment(); setMethod(value as PaymentMethod); }}
            />
            <label className="current-stay__field">
              <span>{t('rooms.walkIn.amount')}</span>
              <Input
                dir="ltr"
                inputMode="decimal"
                value={amount}
                onChange={(event) => { touchPayment(); setAmount(event.target.value); }}
                placeholder="0"
                autoComplete="off"
              />
            </label>
          </div>
          {fieldError && <small className="current-stay__field-error">{fieldError}</small>}
          <Button type="button" variant="secondary" disabled={busy} onClick={() => { void submitPayment(); }}>
            {t('rooms.stay.savePayment')}
          </Button>
        </div>
      )}

      {remaining > 0 ? (
        <p className="current-stay__note">{t('rooms.stay.balanceBlocked')}</p>
      ) : confirming ? (
        <div className="current-stay__confirm" role="alertdialog" aria-label={t('rooms.stay.confirmTitle')}>
          <strong>{t('rooms.stay.confirmTitle')}</strong>
          <p>{t('rooms.stay.confirmMessage')}</p>
          <div>
            <Button type="button" disabled={busy} onClick={() => { void submitCheckOut(); }}>
              {t('rooms.stay.confirmYes')}
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirming(false)}>
              {t('rooms.drawer.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="gold" disabled={busy} onClick={() => setConfirming(true)}>
          <LogOut aria-hidden="true" />
          {t('rooms.stay.checkOut')}
        </Button>
      )}
    </section>
  );
}
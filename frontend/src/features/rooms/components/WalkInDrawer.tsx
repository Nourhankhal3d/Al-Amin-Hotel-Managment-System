import { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/ToastContext';
import type { Language } from '../../../core/i18n';
import { getTranslation } from '../../../core/i18n';
import { ApiError } from '../../../core/api/apiError';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { formatDate } from '../../../utils/date';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { useWalkIn } from '../services/useRooms';
import type { PaymentMethod, Room } from '../types/room.types';
import { addDays, getCairoNow, nightsBetween, toNoonIso } from '../utils/walkInDates';
import './WalkInDrawer.css';

interface WalkInDrawerProps {
  room: Room;
  language: Language;
  onClose: () => void;
  onSuccess: () => void;
}

type FieldErrors = Partial<Record<'name' | 'phone' | 'idNumber' | 'checkOut' | 'amount' | 'method', string>>;

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'instapay', 'vodafone_cash'];
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function newKey(): string {
  return crypto.randomUUID();
}

function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)));
}

 function normalizePhone(value: string): string {
  const latin = toLatinDigits(value).replace(/[\s\-()]/g, '');
  return latin.startsWith('+') ? `+${latin.slice(1).replace(/\D/g, '')}` : latin.replace(/\D/g, '');
}

function normalizeId(value: string): string {
  return toLatinDigits(value).replace(/[\s-]/g, '').toUpperCase();
}

function parseAmount(raw: string): number {
  const cleaned = toLatinDigits(raw).replace(/[,\s]/g, '').replace('٫', '.');
  return cleaned === '' ? Number.NaN : Number(cleaned);
}

export function WalkInDrawer({ room, language, onClose, onSuccess }: WalkInDrawerProps) {
  const t = (key: string) => getTranslation(language, key);
  const toast = useToast();
  const walkIn = useWalkIn();

  // الوقت بتوقيت القاهرة بيتحسب مرة واحدة وقت فتح الفورم
  const [cairo] = useState(() => getCairoNow());
  const beforeNoon = cairo.hour < 12;

  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [earlyArrival, setEarlyArrival] = useState(false);
  const [checkOut, setCheckOut] = useState(() => addDays(beforeNoon ? addDays(cairo.date, -1) : cairo.date, 1));
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const idempotencyKey = useRef(newKey());

  // قبل 12 الظهر: من غير رسوم = بيبدأ من إمبارح، ومع رسوم = النهارده
  const checkIn = beforeNoon && !earlyArrival ? addDays(cairo.date, -1) : cairo.date;
  const minCheckOut = addDays(checkIn, 1);
  const nights = Math.max(0, nightsBetween(checkIn, checkOut));
  const earlyFeeApplies = beforeNoon && earlyArrival;

  const pricePerNight = room.pricePerNight;
  const halfDayPrice = room.halfDayPrice ?? 0;
  const expectedTotal = pricePerNight === undefined
    ? undefined
    : nights * pricePerNight + (earlyFeeApplies ? halfDayPrice : 0);

  const isDirty = [guestName, phone, idNumber, amount, notes].some((value) => value.trim() !== '') || method !== '';

  // أي تعديل = مفتاح جديد + نمسح أخطاء السيرفر القديمة
  function touch() {
    idempotencyKey.current = newKey();
    setServerError(null);
  }

  function requestClose() {
    if (walkIn.isPending) return;
    if (isDirty) setConfirmingDiscard(true);
    else onClose();
  }

  function toggleEarly(value: boolean) {
    touch();
    setEarlyArrival(value);
    const nextCheckIn = beforeNoon && !value ? addDays(cairo.date, -1) : cairo.date;
    if (checkOut <= nextCheckIn) setCheckOut(addDays(nextCheckIn, 1));
  }

  function validate(): { values: FieldErrors; amountValue: number } {
    const values: FieldErrors = {};
    const amountValue = parseAmount(amount);
    if (guestName.trim().length < 2) values.name = t('rooms.walkIn.errors.name');
    if (!/^[A-Z0-9]{5,20}$/.test(normalizeId(idNumber))) values.idNumber = t('rooms.walkIn.errors.idNumber');
    if (!checkOut || checkOut < minCheckOut) values.checkOut = t('rooms.walkIn.errors.checkOut');
    if (!method) values.method = t('rooms.walkIn.errors.method');

    if (!Number.isFinite(amountValue) || amountValue <= 0 || Math.round(amountValue * 100) / 100 !== amountValue) {
      values.amount = t('rooms.walkIn.errors.amount');
    } else if (expectedTotal !== undefined && Math.round(amountValue * 100) > Math.round(expectedTotal * 100)) {
      values.amount = t('rooms.walkIn.errors.amountHigh').replace('{max}', formatCurrency(expectedTotal, language));
    }
    return { values, amountValue };
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { values, amountValue } = validate();
    setErrors(values);
    if (Object.keys(values).length > 0 || !method) return;

    setServerError(null);
    try {
      await walkIn.mutateAsync({
        roomId: room.id,
        guest: {
          name: guestName.trim(),
          phone: normalizePhone(phone),
          idNumber: normalizeId(idNumber),
        },
        checkIn: toNoonIso(checkIn),
        checkOut: toNoonIso(checkOut),
        earlyArrival: earlyFeeApplies,
        payment: { amount: amountValue, method, notes: notes.trim() || undefined },
        idempotencyKey: idempotencyKey.current,
      });
      toast.notify(t('rooms.walkIn.success'), 'success');
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 409) {
        setServerError(`${t('rooms.walkIn.conflict')} ${error.message}`);
      } else {
        setServerError(getErrorMessage(error, language));
      }
    }
  }

  const roomTitle = t('rooms.drawer.roomTitle').replace('{number}', formatNumber(Number(room.number), language));
  const methodOptions = PAYMENT_METHODS.map((value) => ({ value, label: t(`rooms.drawer.paymentMethod.${value}`) }));

  return (
    <Drawer
      open
      title={`${t('rooms.walkIn.title')} · ${roomTitle}`}
      eyebrow={t('rooms.walkIn.eyebrow')}
      onClose={requestClose}
      closeLabel={t('rooms.drawer.close')}
      className="walk-in-drawer"
      footer={(
        <div className="walk-in-drawer__footer">
          <Button type="submit" form="walk-in-form" disabled={walkIn.isPending}>
            {t('rooms.walkIn.submit')}
          </Button>
          <Button variant="secondary" type="button" onClick={requestClose} disabled={walkIn.isPending}>
            {t('rooms.drawer.cancel')}
          </Button>
        </div>
      )}
    >
      {confirmingDiscard && (
        <div className="walk-in-drawer__confirm" role="alertdialog" aria-label={t('rooms.walkIn.discardTitle')}>
          <strong>{t('rooms.walkIn.discardTitle')}</strong>
          <p>{t('rooms.walkIn.discardMessage')}</p>
          <div>
            <Button type="button" onClick={onClose}>{t('rooms.walkIn.discardConfirm')}</Button>
            <Button variant="secondary" type="button" onClick={() => setConfirmingDiscard(false)}>
              {t('rooms.walkIn.discardKeep')}
            </Button>
          </div>
        </div>
      )}

      <form id="walk-in-form" className="walk-in-drawer__form" onSubmit={(event) => { void submit(event); }} noValidate>
        {serverError && (
          <div className="walk-in-drawer__error" role="alert">
            <AlertTriangle aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        <h3 className="walk-in-drawer__heading">{t('rooms.walkIn.guestSection')}</h3>
        <label className="walk-in-drawer__field">
          <span>{t('rooms.walkIn.guestName')}</span>
          <Input
            value={guestName}
            onChange={(event) => { touch(); setGuestName(event.target.value); setErrors((c) => ({ ...c, name: undefined })); }}
            placeholder={t('rooms.walkIn.guestNamePlaceholder')}
            aria-invalid={Boolean(errors.name)}
            autoComplete="off"
          />
          {errors.name && <small>{errors.name}</small>}
        </label>
        <div className="walk-in-drawer__pair">
          <label className="walk-in-drawer__field">
            <span>{t('rooms.drawer.guestPhone')}</span>
                   <Input
              dir="ltr"
              inputMode="tel"
              maxLength={16}
              value={phone}
              onChange={(event) => { touch(); setPhone(event.target.value); setErrors((c) => ({ ...c, phone: undefined })); }}
              aria-invalid={Boolean(errors.phone)}
              autoComplete="off"
            />
            {errors.phone && <small>{errors.phone}</small>}
          </label>
          <label className="walk-in-drawer__field">
            <span>{t('rooms.drawer.guestIdNumber')}</span>
                 <Input
              dir="ltr"
              maxLength={24}
              value={idNumber}
              onChange={(event) => { touch(); setIdNumber(event.target.value); setErrors((c) => ({ ...c, idNumber: undefined })); }}
              aria-invalid={Boolean(errors.idNumber)}
              autoComplete="off"
            />
            {errors.idNumber && <small>{errors.idNumber}</small>}
          </label>
        </div>

        <h3 className="walk-in-drawer__heading">{t('rooms.walkIn.staySection')}</h3>
        {beforeNoon && (
          <label className="walk-in-drawer__check">
            <input type="checkbox" checked={earlyArrival} onChange={(event) => toggleEarly(event.target.checked)} />
            <span>
              <strong>{t('rooms.walkIn.earlyArrival')}</strong>
              <small>{t('rooms.walkIn.earlyArrivalHint')}</small>
            </span>
          </label>
        )}
        <div className="walk-in-drawer__pair">
          <div className="walk-in-drawer__field">
            <span>{t('rooms.walkIn.checkIn')}</span>
            <strong className="walk-in-drawer__static">{formatDate(checkIn, language)}</strong>
          </div>
          <label className="walk-in-drawer__field">
            <span>{t('rooms.walkIn.checkOut')}</span>
            <Input
              type="date"
              min={minCheckOut}
              value={checkOut}
              onChange={(event) => { touch(); setCheckOut(event.target.value); setErrors((c) => ({ ...c, checkOut: undefined })); }}
              aria-invalid={Boolean(errors.checkOut)}
            />
            {errors.checkOut && <small>{errors.checkOut}</small>}
          </label>
        </div>

        <h3 className="walk-in-drawer__heading">{t('rooms.walkIn.paymentSection')}</h3>
        <div className="walk-in-drawer__pair">
          <Select
            label={t('rooms.drawer.paymentMethod.label')}
            value={method}
            placeholder={t('rooms.walkIn.methodPlaceholder')}
            options={methodOptions}
            onChange={(value) => { touch(); setMethod(value as PaymentMethod); setErrors((c) => ({ ...c, method: undefined })); }}
            error={errors.method}
          />
          <label className="walk-in-drawer__field">
            <span>{t('rooms.walkIn.amount')}</span>
            <Input
              dir="ltr"
              inputMode="decimal"
              value={amount}
              onChange={(event) => { touch(); setAmount(event.target.value); setErrors((c) => ({ ...c, amount: undefined })); }}
              placeholder="0"
              aria-invalid={Boolean(errors.amount)}
              autoComplete="off"
            />
            {errors.amount && <small>{errors.amount}</small>}
          </label>
        </div>
        <label className="walk-in-drawer__field">
          <span>{t('rooms.walkIn.notes')}</span>
          <textarea
            className="ui-input walk-in-drawer__notes"
            value={notes}
            onChange={(event) => { touch(); setNotes(event.target.value); }}
            placeholder={t('rooms.walkIn.notesPlaceholder')}
            maxLength={500}
          />
        </label>

        <div className="walk-in-drawer__summary">
          <div>
            <span>{t('rooms.walkIn.nights')}</span>
            <strong>{formatNumber(nights, language)}</strong>
          </div>
          {earlyFeeApplies && (
            <div>
              <span>{t('rooms.walkIn.earlyFee')}</span>
              <strong>{formatCurrency(halfDayPrice, language)}</strong>
            </div>
          )}
          <div>
            <span>{t('rooms.walkIn.expectedTotal')}</span>
            <strong>{expectedTotal === undefined ? '—' : formatCurrency(expectedTotal, language)}</strong>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
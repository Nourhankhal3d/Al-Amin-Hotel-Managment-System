import { useCallback, useState } from 'react';
import { XCircle } from 'lucide-react';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import { NOTES_MAX_LENGTH, OPEN_STATUSES, REFUNDS_I18N, STATUS_TONE } from '../constants/refunds.constants';
import { validateNotes, validatePartialAmount } from '../schemas/partialApproval.schema';
import type { ApprovalDecisionBody, RefundRequest } from '../types/manager-refunds.types';
import { formatCode, formatDay, formatDigits, formatMoney, formatRoom, parseAmount } from '../utils/refundsDisplay';
import './RefundReviewDrawer.css';

interface RefundReviewDrawerProps {
  request: RefundRequest | null;
  isSaving: boolean;
  onClose: () => void;
  onDecide: (body: ApprovalDecisionBody) => void;
}

export function RefundReviewDrawer({ request, ...props }: RefundReviewDrawerProps) {
  if (!request) return null;
  // key: a fresh form for every request that is opened
  return <RefundReview key={request.id} request={request} {...props} />;
}

function RefundReview({ request, isSaving, onClose, onDecide }: RefundReviewDrawerProps & { request: RefundRequest }) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${REFUNDS_I18N}.${key}`), [translate]);
  const [notes, setNotes] = useState(request.managerNotes ?? '');
  const [notesError, setNotesError] = useState<string | null>(null);
  const [isPartial, setIsPartial] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const isOpen = OPEN_STATUSES.includes(request.status);
  const money = (value: number) => formatMoney(value, t, language);
  const code = formatCode(request.code, language);

  function checkNotes(rejecting = false): boolean {
    const error = validateNotes(notes, rejecting);
    setNotesError(error);
    return !error;
  }

  const comment = () => (notes.trim() ? { manager_comment: notes.trim() } : {});

  // Full approval refunds what the guest asked for
  function approveFull() {
    if (!checkNotes()) return;
    onDecide({ action: 'APPROVE', approved_refund_amount: request.requestedAmount, ...comment() });
  }

  function approvePartial() {
    const error = validatePartialAmount(amount, request.requestedAmount, request.originalAmount);
    setAmountError(error);
    if (!checkNotes() || error) return;
    onDecide({ action: 'APPROVE', approved_refund_amount: parseAmount(amount), ...comment() });
  }

  function reject() {
    setIsRejecting(false);
    onDecide({ action: 'REJECT', manager_comment: notes.trim() });
  }

  // The contract needs the reason in manager_comment before a rejection
  function askReject() {
    if (checkNotes(true)) setIsRejecting(true);
  }

  const amountErrorText = amountError
    ? t(`errors.${amountError}`).replace('{amount}', money(request.requestedAmount)).replace('{paid}', money(request.originalAmount))
    : null;

  let footer;
  if (!isOpen) {
    footer = (
      <div className="drawer-details__footer refund-review__footer--single">
        <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
      </div>
    );
  } else if (isPartial) {
    footer = (
      <div className="drawer-details__footer">
        <Button variant="secondary" onClick={() => { setIsPartial(false); setAmountError(null); }} disabled={isSaving}>{t('back')}</Button>
        <Button onClick={approvePartial} disabled={isSaving}>{isSaving ? t('saving') : t('confirmPartial')}</Button>
      </div>
    );
  } else {
    footer = (
      <div className="refund-review__actions">
        <Button onClick={approveFull} disabled={isSaving}>{t('approveFull')}</Button>
        <Button variant="secondary" onClick={() => setIsPartial(true)} disabled={isSaving}>{t('approvePartial')}</Button>
        <Button variant="secondary" className="refund-review__reject" onClick={askReject} disabled={isSaving}>{t('reject')}</Button>
      </div>
    );
  }

  return (
    <>
      <Drawer
        open
        eyebrow={t('drawerEyebrow')}
        title={code}
        closeLabel={t('close')}
        onClose={onClose}
        footer={footer}
        className="refund-review-drawer"
      >
        <div className="drawer-details">
          <div className="drawer-details__grid">
            <div className="drawer-details__info">
              <span>{t('fields.guest')}</span>
              <strong>{request.guestName}</strong>
            </div>
            <div className="drawer-details__info">
              <span>{t('fields.room')}</span>
              <strong>{formatRoom(request.roomNumber, language)}</strong>
            </div>
            <div className="drawer-details__info">
              <span>{t('fields.nationalId')}</span>
              <strong className="refund-review__digits">{request.nationalId ? formatDigits(request.nationalId, language) : '—'}</strong>
            </div>
            <div className="drawer-details__info">
              <span>{t('fields.original')}</span>
              <strong>{money(request.originalAmount)}</strong>
            </div>
            <div className="drawer-details__info">
              <span>{t('fields.requested')}</span>
              <strong>{money(request.requestedAmount)}</strong>
            </div>
            <div className="drawer-details__info">
              <span>{t('fields.type')}</span>
              <strong>{t(`types.${request.refundType}`)}</strong>
            </div>
          </div>

          {!isOpen && (
            <div className="drawer-details__grid">
              <div className="drawer-details__info">
                <span>{t('fields.decision')}</span>
                <strong><Badge tone={STATUS_TONE[request.status]}>{t(`statuses.${request.status}`)}</Badge></strong>
              </div>
              <div className="drawer-details__info">
                <span>{t('fields.approved')}</span>
                <strong>{request.approvedAmount === null ? '—' : money(request.approvedAmount)}</strong>
              </div>
              <div className="drawer-details__info">
                <span>{t('fields.decidedAt')}</span>
                <strong>{formatDay(request.decidedAt, language)}</strong>
              </div>
              <div className="drawer-details__info">
                <span>{t('fields.retained')}</span>
                <strong>{request.retainedAmount === null ? '—' : money(request.retainedAmount)}</strong>
              </div>
            </div>
          )}

          <section>
            <h3 className="drawer-details__heading">{t('fields.reason')}</h3>
            <p className="drawer-details__box">{request.reason || '—'}</p>
          </section>

          <section className="refund-review__field">
            <label className="refund-review__label" htmlFor="refund-notes">{t('fields.notes')}</label>
            {isOpen ? (
              <textarea
                id="refund-notes"
                className={`drawer-details__textarea${notesError ? ' refund-review__control--error' : ''}`}
                value={notes}
                maxLength={NOTES_MAX_LENGTH}
                placeholder={t('placeholders.notes')}
                onChange={(event) => { setNotes(event.target.value); setNotesError(null); }}
              />
            ) : (
              <p id="refund-notes" className="drawer-details__box">{request.managerNotes || '—'}</p>
            )}
            {notesError && (
              <span className="refund-review__error">{t(`errors.${notesError}`).replace('{max}', formatNumber(NOTES_MAX_LENGTH, language))}</span>
            )}
          </section>

          {isOpen && isPartial && (
            <section className="refund-review__field refund-review__partial">
              <label className="refund-review__label" htmlFor="refund-amount">{t('fields.partialAmount')}</label>
              <input
                id="refund-amount"
                inputMode="decimal"
                autoComplete="off"
                autoFocus
                className={`refund-review__input${amountError ? ' refund-review__control--error' : ''}`}
                value={amount}
                placeholder={t('placeholders.amount')}
                aria-invalid={amountError ? true : undefined}
                aria-describedby="refund-amount-hint"
                onChange={(event) => { setAmount(event.target.value); setAmountError(null); }}
              />
              <span id="refund-amount-hint" className={amountErrorText ? 'refund-review__error' : 'refund-review__hint'}>
                {amountErrorText ?? t('partialHint').replace('{amount}', money(request.requestedAmount))}
              </span>
            </section>
          )}
        </div>
      </Drawer>

      {isRejecting && (
        // Wrapper only scopes the red confirm button style to this dialog
        <div className="refund-review__confirm">
        <ConfirmDialog
          variant="danger"
          icon={<XCircle aria-hidden="true" />}
          title={t('rejectTitle').replace('{code}', code)}
          description={t('rejectDescription').replace('{guest}', request.guestName).replace('{amount}', money(request.requestedAmount))}
          confirmLabel={t('reject')}
          cancelLabel={t('cancel')}
          busy={isSaving}
          onConfirm={reject}
          onCancel={() => setIsRejecting(false)}
        />
        </div>
      )}
    </>
  );
}

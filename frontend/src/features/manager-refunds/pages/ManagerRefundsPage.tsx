import { useCallback, useMemo, useState } from 'react';
import { FileText, Wallet } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/ToastContext';
import { newIdempotencyKey } from '../../../core/api/idempotency';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { exportCsv } from '../../../utils/exportCsv';
import { RefundRequestsList } from '../components/RefundRequestsList';
import { RefundReviewDrawer } from '../components/RefundReviewDrawer';
import { OPEN_STATUSES, REFUNDS_I18N } from '../constants/refunds.constants';
import { useDecideRefund, useRefundRequests } from '../hooks/useManagerRefunds';
import type { ApprovalDecisionBody, RefundRequest } from '../types/manager-refunds.types';
import { apiErrorText } from '../utils/apiErrorText';
import { formatCode, formatDay, formatMoney, pluralText } from '../utils/refundsDisplay';
import './ManagerRefundsPage.css';

/** Waiting requests first, then the newest */
function byPriority(a: RefundRequest, b: RefundRequest): number {
  const open = Number(OPEN_STATUSES.includes(b.status)) - Number(OPEN_STATUSES.includes(a.status));
  return open || new Date(b.requestedAt ?? 0).getTime() - new Date(a.requestedAt ?? 0).getTime();
}

// URL params: pending=1 (only the requests still waiting) and id (review drawer)
export function ManagerRefundsPage() {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${REFUNDS_I18N}.${key}`), [translate]);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const onlyPending = searchParams.get('pending') === '1';
  const requestsQuery = useRefundRequests();
  const decide = useDecideRefund();
  // One key per opened request, so a retry after a network error is not a second decision
  const [decisionKey, setDecisionKey] = useState(newIdempotencyKey);

  const requests = useMemo(() => [...(requestsQuery.data ?? [])].sort(byPriority), [requestsQuery.data]);
  const visible = useMemo(
    () => (onlyPending ? requests.filter((item) => OPEN_STATUSES.includes(item.status)) : requests),
    [onlyPending, requests],
  );
  const selected = requests.find((item) => item.id === searchParams.get('id')) ?? null;
  const pendingCount = requests.filter((item) => OPEN_STATUSES.includes(item.status)).length;

  const updateParams = useCallback((changes: Record<string, string | null>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [name, value] of Object.entries(changes)) {
        if (value === null || value === '') next.delete(name);
        else next.set(name, value);
      }
      return next;
    });
  }, [setSearchParams]);

  function openRequest(id: string) {
    setDecisionKey(newIdempotencyKey());
    updateParams({ id });
  }

  async function submitDecision(body: ApprovalDecisionBody) {
    if (!selected) return;
    try {
      const saved = await decide.mutateAsync({ id: selected.id, body, idempotencyKey: decisionKey });
      const code = formatCode(saved.code, language);
      if (saved.status === 'REJECTED') {
        toast.notify(t('toastRejected').replace('{code}', code), 'success');
      } else {
        const approved = saved.approvedAmount ?? body.approved_refund_amount ?? 0;
        const partial = approved < selected.requestedAmount;
        toast.notify(t(partial ? 'toastPartial' : 'toastApproved')
          .replace('{code}', code).replace('{amount}', formatMoney(approved, t, language)), 'success');
      }
      updateParams({ id: null });
    } catch (error) {
      toast.notify(apiErrorText(error, t, language), 'error');
    }
  }

  function exportRequests() {
    const exported = exportCsv<RefundRequest>(visible, [
      { header: t('fields.code'), value: (item) => item.code },
      { header: t('fields.room'), value: (item) => item.roomNumber },
      { header: t('fields.guest'), value: (item) => item.guestName },
      { header: t('fields.original'), value: (item) => item.originalAmount },
      { header: t('fields.requested'), value: (item) => item.requestedAmount },
      { header: t('fields.type'), value: (item) => t(`types.${item.refundType}`) },
      { header: t('fields.status'), value: (item) => t(`statuses.${item.status}`) },
      { header: t('fields.approved'), value: (item) => item.approvedAmount ?? '' },
      { header: t('fields.retained'), value: (item) => item.retainedAmount ?? '' },
      { header: t('fields.requestType'), value: (item) => t(`requestTypes.${item.requestType}`) },
      { header: t('fields.date'), value: (item) => formatDay(item.requestedAt, language) },
      { header: t('fields.reason'), value: (item) => item.reason },
      { header: t('fields.notes'), value: (item) => item.managerNotes ?? '' },
    ], `refund-requests-${new Date().toISOString().slice(0, 10)}.csv`);
    if (exported) toast.notify(pluralText(t, 'toastExported', visible.length, language), 'success');
    else toast.notify(t('toastNothingToExport'), 'warning');
  }

  const hero = (withActions: boolean) => (
    <PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}>
      {withActions && (
        <>
          <Button variant="glass" onClick={exportRequests}>
            <FileText aria-hidden="true" />
            {t('export')}
          </Button>
          <Button variant="gold" aria-pressed={onlyPending} onClick={() => updateParams({ pending: onlyPending ? null : '1' })}>
            <Wallet aria-hidden="true" />
            {onlyPending ? t('showAll') : t('showPending')}
          </Button>
        </>
      )}
    </PageHero>
  );

  if (requestsQuery.isPending) {
    return <div className="feature-page manager-refunds">{hero(false)}<LoadingState label={t('loading')} /></div>;
  }

  if (requestsQuery.isError) {
    return (
      <div className="feature-page manager-refunds">
        {hero(false)}
        <ErrorState
          title={t('loadError')}
          message={getErrorMessage(requestsQuery.error, language)}
          action={<Button onClick={() => { void requestsQuery.refetch(); }}>{t('retry')}</Button>}
        />
      </div>
    );
  }

  return (
    <div className="feature-page manager-refunds">
      {hero(true)}

      {onlyPending && (
        <p className="manager-refunds__summary" role="status">
          {pendingCount > 0 ? pluralText(t, 'pendingCount', pendingCount, language) : t('noPending')}
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title={onlyPending ? t('emptyPending') : t('emptyAll')}
          description={onlyPending ? t('emptyPendingHint') : t('emptyAllHint')}
          action={onlyPending ? <Button variant="secondary" onClick={() => updateParams({ pending: null })}>{t('showAll')}</Button> : undefined}
        />
      ) : (
        <RefundRequestsList requests={visible} onOpen={openRequest} />
      )}

      <RefundReviewDrawer
        request={selected}
        isSaving={decide.isPending}
        onClose={() => updateParams({ id: null })}
        onDecide={submitDecision}
      />
    </div>
  );
}

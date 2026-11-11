import { useCallback } from 'react';
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { REFUNDS_I18N, STATUS_TONE, TYPE_TONE } from '../constants/refunds.constants';
import type { RefundRequest } from '../types/manager-refunds.types';
import { formatCode, formatDay, formatMoney, formatRoom } from '../utils/refundsDisplay';
import './RefundRequestsList.css';

interface RefundRequestsListProps {
  requests: RefundRequest[];
  onOpen: (id: string) => void;
}

export function RefundRequestsList({ requests, onOpen }: RefundRequestsListProps) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${REFUNDS_I18N}.${key}`), [translate]);
  // The arrow points to the side the drawer opens from
  const OpenIcon = language === 'ar' ? ChevronRight : ChevronLeft;

  return (
    <ul className="refunds-list">
      {requests.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className="refunds-list__row"
            aria-label={t('openRequest').replace('{code}', formatCode(item.code, language)).replace('{guest}', item.guestName)}
            onClick={() => onOpen(item.id)}
          >
            <span className="refunds-list__icon" aria-hidden="true"><Wallet /></span>
            <span className="refunds-list__text">
              <span className="refunds-list__meta">
                {t('roomLabel').replace('{room}', formatRoom(item.roomNumber, language))}
                {' · '}
                {formatCode(item.code, language)}
              </span>
              <strong className="refunds-list__guest">{item.guestName}</strong>
              <span className="refunds-list__amounts">
                {t('originalLine').replace('{amount}', formatMoney(item.originalAmount, t, language))}
                {' · '}
                {t('requestedLine').replace('{amount}', formatMoney(item.requestedAmount, t, language))}
                {' · '}
                {formatDay(item.requestedAt, language)}
              </span>
            </span>
            <span className="refunds-list__badges">
              <Badge tone={STATUS_TONE[item.status]}>{t(`statuses.${item.status}`)}</Badge>
              <Badge tone={TYPE_TONE[item.refundType]}>{t(`types.${item.refundType}`)}</Badge>
            </span>
            <OpenIcon className="refunds-list__chevron" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

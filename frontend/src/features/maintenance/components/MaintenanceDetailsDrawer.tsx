import { useId, useState } from 'react';
import { Wrench } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { getTranslation, type Language } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import {
  NEXT_STATUSES,
  PRIORITY_LABEL_KEY,
  PRIORITY_TONE,
  STATUS_LABEL_KEY,
} from '../constants/maintenance.constants';
import { validateStatusChange } from '../schemas/maintenanceRequest.schema';
import type { MaintenanceIssueUpdate, MaintenanceRequest } from '../types/maintenance.types';
import { formatReference, formatRequestTime, formatTimeAgo, lastUpdateOf } from '../utils/maintenanceDisplay';
import './MaintenanceDetailsDrawer.css';

const EMPTY_VALUE = '—';
const noop = () => undefined;

type NextStatus = NonNullable<MaintenanceIssueUpdate['status']>;

interface MaintenanceDetailsDrawerProps {
  request: MaintenanceRequest | null;
  language: Language;
  onClose: () => void;
  onSave: (status: NextStatus) => void;
  isSaving: boolean;
}

// The parent gives this component a `key` per request, so the editor resets when another request opens.
export function MaintenanceDetailsDrawer({ request, language, onClose, onSave, isSaving }: MaintenanceDetailsDrawerProps) {
  const t = (key: string) => getTranslation(language, key);
  const statusSelectId = useId();
  const [draftStatus, setDraftStatus] = useState<NextStatus | ''>('');
  const [statusError, setStatusError] = useState<string>();

  const nextStatuses = request ? NEXT_STATUSES[request.status] : [];
  const canChangeStatus = nextStatuses.length > 0;

  const changeDraftStatus = (next: string) => {
    const status = next as NextStatus;
    setDraftStatus(status);
    if (statusError && request) setStatusError(validateStatusChange(request.status, status));
  };

  const save = () => {
    if (!request || isSaving) return;
    const error = validateStatusChange(request.status, draftStatus);
    if (error) {
      setStatusError(error);
      document.getElementById(statusSelectId)?.focus({ preventScroll: true });
      return;
    }
    onSave(draftStatus as NextStatus);
  };

  const roomValue = request ? request.room_number || request.room_id : '';
  const roomDisplay = Number.isFinite(Number(roomValue)) ? formatNumber(Number(roomValue), language) : roomValue;

  return (
    <Drawer
      open={request !== null}
      title={request ? `${t('roomLabel')} ${roomDisplay}` : ''}
      eyebrow={t('mtDetailsEyebrow')}
      closeLabel={t('drawerClose')}
      onClose={onClose}
      className="maintenance-details-drawer"
      footer={
        <div className="maintenance-details__footer">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>{t('mtClose')}</Button>
          {canChangeStatus && <Button onClick={save} disabled={isSaving}>{t('mtSaveReport')}</Button>}
        </div>
      }
    >
      {request && (
        <div className="maintenance-details">
          <section className="maintenance-details__summary">
            <span className="maintenance-details__icon"><Wrench aria-hidden="true" /></span>
            <div className="maintenance-details__summary-text">
              <strong>{request.problem}</strong>
              <span>
                {formatReference(request.issue_id, language)}
                {' · '}
                {t('mtReportedAt').replace('{time}', formatRequestTime(request.created_date, language))}
              </span>
            </div>
            <Badge tone={PRIORITY_TONE[request.priority]}>{t(PRIORITY_LABEL_KEY[request.priority])}</Badge>
          </section>

          <div className="maintenance-details__grid">
            <div className="maintenance-details__info">
              <span>{t('mtFormTechnician')}</span>
              <strong>{EMPTY_VALUE}</strong>
            </div>
            <div className="maintenance-details__info">
              <span>{t('statusLabel')}</span>
              <strong>{t(STATUS_LABEL_KEY[request.status])}</strong>
            </div>
            <div className="maintenance-details__info">
              <span>{t('mtExpectedFix')}</span>
              <strong>{request.resolved_date ? formatRequestTime(request.resolved_date, language) : EMPTY_VALUE}</strong>
            </div>
            <div className="maintenance-details__info">
              <span>{t('mtColLastUpdate')}</span>
              <strong>{formatTimeAgo(lastUpdateOf(request), language)}</strong>
            </div>
          </div>

          <section className="maintenance-details__editor">
            <Select
              id={`${statusSelectId}-tech`}
              label={t('mtFormTechnician')}
              value=""
              placeholder={EMPTY_VALUE}
              options={[]}
              onChange={noop}
              disabled
            />
            {canChangeStatus ? (
              <Select
                id={statusSelectId}
                label={t('updateStatus')}
                value={draftStatus}
                placeholder={t('mtChooseStatus')}
                options={nextStatuses.map((option) => ({ value: option, label: t(STATUS_LABEL_KEY[option]) }))}
                onChange={changeDraftStatus}
                error={statusError ? t(statusError) : undefined}
                disabled={isSaving}
              />
            ) : (
              <Select
                id={statusSelectId}
                label={t('updateStatus')}
                value=""
                placeholder={t(STATUS_LABEL_KEY[request.status])}
                options={[]}
                onChange={noop}
                disabled
              />
            )}
          </section>

          <section>
            <h3 className="maintenance-details__heading">{t('mtDescription')}</h3>
            <p className="maintenance-details__box">{request.notes || EMPTY_VALUE}</p>
          </section>

          <section>
            <h3 className="maintenance-details__heading">{t('mtRoomInfo')}</h3>
            <div className="maintenance-details__grid">
              <div className="maintenance-details__info">
                <span>{t('roomNumberLabel')}</span>
                <strong>{roomDisplay}</strong>
              </div>
              <div className="maintenance-details__info">
                <span>{t('mtGuest')}</span>
                <strong>{EMPTY_VALUE}</strong>
              </div>
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );
}
import { useId, useRef, useState } from 'react';
import { Check, Receipt, Wrench } from 'lucide-react';
import { Timeline } from '../../../components/common/Timeline';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { getTranslation, type Language } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import {
  LOG_DESCRIPTION_KEY,
  LOG_TITLE_KEY,
  PRIORITY_LABEL_KEY,
  PRIORITY_TONE,
  STATUS_LABEL_KEY,
  STATUS_OPTIONS,
} from '../constants/maintenance.constants';
import { validateStatusChange } from '../schemas/maintenanceRequest.schema';
import type { MaintenanceRequest, RequestStatus } from '../types/maintenance.types';
import { formatReference, formatRequestTime, formatTimeAgo } from '../utils/maintenanceDisplay';
import './MaintenanceDetailsDrawer.css';

const EMPTY_VALUE = '—';

interface MaintenanceDetailsDrawerProps {
  request: MaintenanceRequest | null;
  language: Language;
  onClose: () => void;
  onSave: (status: RequestStatus) => void;
  isSaving: boolean;
}

// The parent gives this component a `key` per request, so the editor resets when another request opens.
export function MaintenanceDetailsDrawer({ request, language, onClose, onSave, isSaving }: MaintenanceDetailsDrawerProps) {
  const t = (key: string) => getTranslation(language, key);
  const statusSelectId = useId();
  const statusRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLElement>(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [draftStatus, setDraftStatus] = useState<RequestStatus | ''>('');
  const [statusError, setStatusError] = useState<string>();

  const scrollTo = (element: HTMLElement | null) => element?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const focusStatusSelect = () => {
    // The select appears on the next render, so wait one frame before focusing it
    requestAnimationFrame(() => document.getElementById(statusSelectId)?.focus({ preventScroll: true }));
    scrollTo(statusRef.current);
  };

  const startEditingStatus = () => {
    setIsEditingStatus(true);
    focusStatusSelect();
  };

  const changeDraftStatus = (next: string) => {
    const status = next as RequestStatus;
    setDraftStatus(status);
    if (statusError && request) setStatusError(validateStatusChange(request.status, status));
  };

  const save = () => {
    if (!request || isSaving) return;
    const error = validateStatusChange(request.status, draftStatus);
    if (error) {
      setStatusError(error);
      setIsEditingStatus(true);
      focusStatusSelect();
      return;
    }
    onSave(draftStatus as RequestStatus);
  };

  const logItems = request
    ? [...request.log].reverse().map((entry) => ({
        id: entry.id,
        title: t(LOG_TITLE_KEY[entry.event]),
        description: entry.event === 'status_changed' && entry.status
          ? t(LOG_DESCRIPTION_KEY.status_changed).replace('{status}', t(STATUS_LABEL_KEY[entry.status]))
          : t(LOG_DESCRIPTION_KEY[entry.event]),
        time: formatRequestTime(entry.at, language),
      }))
    : [];

  // Every status except the current one, so "save" always means a real change
  const statusOptions = request
    ? STATUS_OPTIONS.filter((option) => option !== request.status).map((option) => ({ value: option, label: t(STATUS_LABEL_KEY[option]) }))
    : [];

  return (
    <Drawer
      open={request !== null}
      title={request ? `${t('roomLabel')} ${formatNumber(Number(request.roomNumber), language)}` : ''}
      eyebrow={t('mtDetailsEyebrow')}
      closeLabel={t('drawerClose')}
      onClose={onClose}
      className="maintenance-details-drawer"
      footer={
        <div className="maintenance-details__footer">
          <Button variant="secondary" onClick={startEditingStatus} disabled={isSaving}>{t('updateStatus')}</Button>
          <Button onClick={save} disabled={isSaving}>{t('mtSaveChanges')}</Button>
        </div>
      }
    >
      {request && (
        <div className="maintenance-details">
          <section className="maintenance-details__summary">
            <span className="maintenance-details__icon"><Wrench aria-hidden="true" /></span>
            <div className="maintenance-details__summary-text">
              <strong>{request.title}</strong>
              <span>
                {formatReference(request.referenceNumber, language)}
                {' · '}
                {t('mtReportedAt').replace('{time}', formatRequestTime(request.reportedAt, language))}
              </span>
            </div>
            <Badge tone={PRIORITY_TONE[request.priority]}>{t(PRIORITY_LABEL_KEY[request.priority])}</Badge>
          </section>

          <div className="maintenance-details__grid">
            <div ref={statusRef} className={`maintenance-details__info${isEditingStatus ? ' maintenance-details__info--editing' : ''}`}>
              <span>{t('statusLabel')}</span>
              {isEditingStatus ? (
                <Select
                  id={statusSelectId}
                  value={draftStatus}
                  placeholder={t('mtChooseStatus')}
                  options={statusOptions}
                  onChange={changeDraftStatus}
                  error={statusError ? t(statusError) : undefined}
                  disabled={isSaving}
                />
              ) : (
                <strong>{t(STATUS_LABEL_KEY[request.status])}</strong>
              )}
            </div>
            {/* Always shown so "last update" stays on its own row under the status, as in the prototype */}
            <div className="maintenance-details__info">
              <span>{t('mtExpectedFix')}</span>
              <strong>{request.expectedFixAt ? formatRequestTime(request.expectedFixAt, language) : EMPTY_VALUE}</strong>
            </div>
            <div className="maintenance-details__info">
              <span>{t('mtColLastUpdate')}</span>
              <strong>{formatTimeAgo(request.updatedAt, language)}</strong>
            </div>
          </div>

          <section>
            <h3 className="maintenance-details__heading">{t('mtDescription')}</h3>
            <p className="maintenance-details__box">{request.notes || EMPTY_VALUE}</p>
          </section>

          <section ref={logRef}>
            <h3 className="maintenance-details__heading">{t('mtLog')}</h3>
            {logItems.length > 0
              ? <Timeline items={logItems} />
              : <p className="maintenance-details__box">{t('mtLogEmpty')}</p>}
          </section>

          <div className="maintenance-details__actions">
            <button type="button" className="maintenance-details__action" onClick={() => scrollTo(statusRef.current)}>
              <Check aria-hidden="true" />
              {t('followStatus')}
            </button>
            <button type="button" className="maintenance-details__action" onClick={() => scrollTo(logRef.current)}>
              <Receipt aria-hidden="true" />
              {t('viewLog')}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}

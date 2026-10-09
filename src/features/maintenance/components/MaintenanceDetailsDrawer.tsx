import './MaintenanceDetailsDrawer.css';
import { Timeline } from '../../../components/common/Timeline';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { useLanguage } from '../../../core/i18n/useLanguage';
import {
  PRIORITY_LABEL_KEY,
  PRIORITY_TONE,
  STATUS_LABEL_KEY,
} from '../constants/maintenance.constants';
import type { RequestPriority, RequestStatus } from '../constants/maintenance.constants';

// TODO: move to types/maintenance.types.ts and confirm fields with backend
export interface MaintenanceDetails {
  id: string;
  roomNumber: string;
  issue: string;
  reference?: string;
  reportedAt?: string;
  status: RequestStatus;
  priority: RequestPriority;
  expectedFixAt?: string;
  lastUpdate?: string;
  notes?: string;
  log: Array<{ id: string; title: string; description?: string; time?: string }>;
}

interface MaintenanceDetailsDrawerProps {
  request: MaintenanceDetails | null;
  onClose: () => void;
}

export function MaintenanceDetailsDrawer({ request, onClose }: MaintenanceDetailsDrawerProps) {
  const { t } = useLanguage();

  return (
    <Drawer
      open={request !== null}
      title={request ? `${t('roomLabel')} ${request.roomNumber}` : ''}
      eyebrow={t('mtDetailsEyebrow')}
      closeLabel={t('drawerClose')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary">{t('updateStatus')}</Button>
          <Button>{t('mtSaveChanges')}</Button>
        </>
      }
    >
      {request && (
        <div className="maintenance-details">
          <section className="maintenance-details__summary">
            <span className="maintenance-details__icon">🔧</span>
            <div className="maintenance-details__summary-text">
              <strong>{request.issue}</strong>
              <span>
                {request.reference}
                {request.reference && request.reportedAt ? ' · ' : ''}
                {request.reportedAt}
              </span>
            </div>
            <Badge tone={PRIORITY_TONE[request.priority]}>{t(PRIORITY_LABEL_KEY[request.priority])}</Badge>
          </section>

          <div className="maintenance-details__grid">
            <div className="maintenance-details__info">
              <span>{t('statusLabel')}</span>
              <strong>{t(STATUS_LABEL_KEY[request.status])}</strong>
            </div>
            {request.expectedFixAt && (
              <div className="maintenance-details__info">
                <span>{t('mtExpectedFix')}</span>
                <strong>{request.expectedFixAt}</strong>
              </div>
            )}
            {request.lastUpdate && (
              <div className="maintenance-details__info">
                <span>{t('mtColLastUpdate')}</span>
                <strong>{request.lastUpdate}</strong>
              </div>
            )}
          </div>

          {request.notes && (
            <section>
              <h3 className="maintenance-details__heading">{t('mtDescription')}</h3>
              <p className="maintenance-details__box">{request.notes}</p>
            </section>
          )}

          <section>
            <h3 className="maintenance-details__heading">{t('mtLog')}</h3>
            <Timeline items={request.log} />
          </section>

          {/* TODO: connect these actions when the service layer is ready */}
          <div className="maintenance-details__actions">
            <button type="button" className="maintenance-details__action">
              <span>✓</span>
              {t('followStatus')}
            </button>
            <button type="button" className="maintenance-details__action">
              <span>▤</span>
              {t('viewLog')}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
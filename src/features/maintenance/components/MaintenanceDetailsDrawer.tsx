import './MaintenanceDetailsDrawer.css';
import { Timeline } from '../../../components/common/Timeline';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';

// TEMP: texts live here until i18n is wired
const LABELS = {
  eyebrow: 'تفاصيل بلاغ الصيانة',
  status: 'الحالة',
  expectedFix: 'الحل المتوقع',
  lastUpdate: 'آخر تحديث',
  description: 'وصف المشكلة',
  log: 'سجل البلاغ',
  followStatus: 'متابعة الحالة',
  viewLog: 'عرض السجل',
  updateStatus: 'تحديث الحالة',
  saveChanges: 'حفظ التغييرات',
};

// TODO: move to types/maintenance.types.ts and confirm fields with backend
export interface MaintenanceDetails {
  id: string;
  roomNumber: string;
  issue: string;
  reference?: string;
  reportedAt?: string;
  status: string;
  priority: string;
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
  return (
    <Drawer
      open={request !== null}
      title={request ? `غرفة ${request.roomNumber}` : ''}
      eyebrow={LABELS.eyebrow}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary">{LABELS.updateStatus}</Button>
          <Button>{LABELS.saveChanges}</Button>
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
            {/* TODO: map priority to tone from maintenance.constants.ts */}
            <Badge tone="danger">{request.priority}</Badge>
          </section>

          <div className="maintenance-details__grid">
            <div className="maintenance-details__info">
              <span>{LABELS.status}</span>
              <strong>{request.status}</strong>
            </div>
            {request.expectedFixAt && (
              <div className="maintenance-details__info">
                <span>{LABELS.expectedFix}</span>
                <strong>{request.expectedFixAt}</strong>
              </div>
            )}
            {request.lastUpdate && (
              <div className="maintenance-details__info">
                <span>{LABELS.lastUpdate}</span>
                <strong>{request.lastUpdate}</strong>
              </div>
            )}
          </div>

          {request.notes && (
            <section>
              <h3 className="maintenance-details__heading">{LABELS.description}</h3>
              <p className="maintenance-details__box">{request.notes}</p>
            </section>
          )}

          <section>
            <h3 className="maintenance-details__heading">{LABELS.log}</h3>
            <Timeline items={request.log} />
          </section>

          {/* TODO: connect these actions when the service layer is ready */}
          <div className="maintenance-details__actions">
            <button type="button" className="maintenance-details__action">
              <span>✓</span>
              {LABELS.followStatus}
            </button>
            <button type="button" className="maintenance-details__action">
              <span>▤</span>
              {LABELS.viewLog}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
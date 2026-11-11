import { useCallback, useState } from 'react';
import { Wrench } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { MAINTENANCE_I18N, PRIORITY_TONE, STATUS_OPTIONS } from '../constants/maintenance.constants';
import type {
  MaintenanceStatus,
  MaintenanceTicket,
  MaintenanceTicketUpdate,
  TechnicianOption,
} from '../types/manager-maintenance.types';
import { formatCode, formatRoom, formatSince, formatTime, fromTimeInput, toTimeInput } from '../utils/maintenanceDisplay';
import './MaintenanceDrawers.css';

interface MaintenanceTicketDrawerProps {
  ticket: MaintenanceTicket | null;
  /** Current guest of the ticket's room, from the rooms list */
  guestName: string | null;
  technicians: TechnicianOption[];
  isSaving: boolean;
  now: number;
  onClose: () => void;
  onSave: (changes: MaintenanceTicketUpdate) => void;
}

export function MaintenanceTicketDrawer({ ticket, ...props }: MaintenanceTicketDrawerProps) {
  if (!ticket) return null;
  // key: a fresh form for every ticket that is opened
  return <TicketDetails key={ticket.id} ticket={ticket} {...props} />;
}

function TicketDetails({ ticket, guestName, technicians, isSaving, now, onClose, onSave }: MaintenanceTicketDrawerProps & { ticket: MaintenanceTicket }) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${MAINTENANCE_I18N}.${key}`), [translate]);
  const [technicianId, setTechnicianId] = useState(ticket.technicianId ?? '');
  const [status, setStatus] = useState<MaintenanceStatus>(ticket.status);
  const [expected, setExpected] = useState(toTimeInput(ticket.expectedResolutionAt));

  const room = formatRoom(ticket.roomNumber, language);
  // A resolved ticket stays resolved: a new problem is a new ticket
  const statusOptions = ticket.status === 'RESOLVED' ? ['RESOLVED' as const] : STATUS_OPTIONS;

  function save() {
    const changes: MaintenanceTicketUpdate = {};
    if (technicianId !== (ticket.technicianId ?? '')) changes.assigned_to_staff_id = technicianId || null;
    if (status !== ticket.status) changes.status = status;
    if (expected !== toTimeInput(ticket.expectedResolutionAt)) changes.expected_resolution_at = fromTimeInput(expected);
    onSave(changes);
  }

  return (
    <Drawer
      open
      eyebrow={t('drawerEyebrow')}
      title={t('drawerTitle').replace('{room}', room)}
      closeLabel={t('close')}
      onClose={onClose}
      footer={(
        <div className="drawer-details__footer">
          <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
          <Button onClick={save} disabled={isSaving}>{isSaving ? t('saving') : t('saveTicket')}</Button>
        </div>
      )}
    >
      <div className="drawer-details">
        <section className="drawer-details__summary">
          <span className="drawer-details__icon"><Wrench aria-hidden="true" /></span>
          <div className="drawer-details__summary-text">
            <strong>{ticket.issue}</strong>
            <span>
              {t('reportedLine')
                .replace('{code}', formatCode(ticket.code, language))
                .replace('{time}', formatTime(ticket.reportedAt, language))}
            </span>
          </div>
          <Badge tone={PRIORITY_TONE[ticket.priority]}>{t(`priorities.${ticket.priority}`)}</Badge>
        </section>

        <div className="drawer-details__grid">
          <div className="mt-drawer__tile">
            <span>{t('fields.technician')}</span>
            <Select
              className="mt-drawer__tile-select"
              value={technicianId}
              placeholder={t('unassigned')}
              options={technicians.map((technician) => ({ value: technician.id, label: technician.name }))}
              onChange={setTechnicianId}
            />
          </div>
          <div className="mt-drawer__tile">
            <span>{t('fields.status')}</span>
            <Select
              className="mt-drawer__tile-select"
              value={status}
              options={statusOptions.map((value) => ({ value, label: t(`statuses.${value}`) }))}
              onChange={(value) => setStatus(value as MaintenanceStatus)}
            />
          </div>
          <label className="mt-drawer__tile" htmlFor="mt-expected">
            <span>{t('fields.expected')}</span>
            <input
              id="mt-expected"
              type="time"
              className="mt-drawer__tile-input"
              value={expected}
              onChange={(event) => setExpected(event.target.value)}
            />
          </label>
          <div className="drawer-details__info">
            <span>{t('fields.updated')}</span>
            <strong>{formatSince(ticket.updatedAt, t, language, now)}</strong>
          </div>
        </div>

        <section>
          <h3 className="drawer-details__heading">{t('fields.description')}</h3>
          <p className="drawer-details__box">{ticket.description || t('noDescription')}</p>
        </section>

        <section>
          <h3 className="drawer-details__heading">{t('roomInfo')}</h3>
          <div className="drawer-details__grid">
            <div className="drawer-details__info">
              <span>{t('fields.room')}</span>
              <strong>{room}</strong>
            </div>
            <div className="drawer-details__info">
              <span>{t('fields.guest')}</span>
              <strong>{guestName || t('noGuest')}</strong>
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  );
}

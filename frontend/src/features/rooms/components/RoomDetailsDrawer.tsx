import { useEffect, useState } from 'react';
import { BedDouble, CreditCard, NotebookText, Sparkles, UserRound, Wrench } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import type { Language } from '../../../core/i18n';
import { getTranslation } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import { formatRelativeTime } from '../../../utils/date';
import { ROOM_STATUS_OPTIONS, ROOM_TYPE_OPTIONS } from '../constants/roomOptions';
import type { Room, RoomStatus, RoomType } from '../types/room.types';
import { getRoomGuestName } from '../utils/roomDisplay';
import { RoomStatusBadge } from './RoomStatusBadge';
import './RoomDetailsDrawer.css';

interface RoomDetailsDrawerProps {
  room: Room | undefined;
  language: Language;
  onClose: () => void;
  onSave: (status: RoomStatus, notes: string) => void;
  isSaving: boolean;
}

export function RoomDetailsDrawer({
  room,
  language,
  onClose,
  onSave,
  isSaving,
}: RoomDetailsDrawerProps) {
  const t = (key: string) => getTranslation(language, key);

  const [draftStatus, setDraftStatus] = useState<RoomStatus>('available');
  const [draftType, setDraftType] = useState<RoomType>('standard');
  const [guestCount, setGuestCount] = useState('2');
  const [guestName, setGuestName] = useState('');
  const [nationalId, setNationalId] = useState('29801011234567');
  const [phone, setPhone] = useState('+20 100 000 0000');
  const [paymentStatus, setPaymentStatus] = useState('paidFull');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('14:00');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('12:00');

  useEffect(() => {
    if (room) {
      setDraftStatus(room.status);
      setDraftType(room.type);
      setGuestName(room.guestName ?? '');
      setArrivalDate(room.arrivalDate ? room.arrivalDate.slice(0, 10) : '');
    }
  }, [room]);

  if (!room) return null;

  const detailTitle = t('rooms.drawer.roomTitle').replace(
    '{number}',
    formatNumber(Number(room.number), language),
  );

  const statusOptions = ROOM_STATUS_OPTIONS.filter((o) => o.value !== '').map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }));

  const typeOptions = ROOM_TYPE_OPTIONS.filter((o) => o.value !== '').map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }));

  const guestCountOptions = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
  ];

  const paymentOptions = [
    { value: 'paidFull', label: t('rooms.drawer.paidFull') },
    { value: 'paidPartial', label: t('rooms.drawer.paidPartial') },
    { value: 'pending', label: t('rooms.drawer.pending') },
    { value: 'unpaid', label: t('rooms.drawer.unpaid') },
  ];

  const displayedGuestName = guestName || getRoomGuestName(room, language) || '—';

  return (
    <Drawer
      open
      title={detailTitle}
      eyebrow={t('rooms.drawer.workspaceEyebrow')}
      onClose={onClose}
      closeLabel={t('rooms.drawer.close')}
      className="room-details-drawer"
      footer={(
        <div className="room-details-drawer__footer">
          <Button
            type="button"
            className="room-details-drawer__save-btn"
            disabled={isSaving}
            onClick={() => onSave(draftStatus, room.notes)}
          >
            {isSaving ? t('loading') : t('rooms.drawer.saveChanges')}
          </Button>
          <Button
            type="button"
            className="room-details-drawer__cancel-btn"
            variant="secondary"
            onClick={onClose}
          >
            {t('rooms.drawer.cancel')}
          </Button>
        </div>
      )}
    >
      {/* Summary Card */}
      <section className="room-details-drawer__summary">
        <div className="room-details-drawer__bed-icon">
          <BedDouble aria-hidden="true" />
        </div>
        <div className="room-details-drawer__summary-text">
          <strong>
            {draftType === 'vip' ? t('rooms.drawer.vipRoom') : t('rooms.drawer.standardRoom')}
          </strong>
          <span>
            {t(`rooms.floor.${room.floor}`)} • 25 م²
          </span>
        </div>
        <RoomStatusBadge status={draftStatus} language={language} />
      </section>

      {/* Form Fields Grid */}
      <section className="room-details-drawer__form">
        <div className="room-details-drawer__field">
          <Select
            label={t('rooms.drawer.roomStatus')}
            value={draftStatus}
            options={statusOptions}
            onChange={(val) => setDraftStatus(val as RoomStatus)}
          />
        </div>
        <div className="room-details-drawer__field">
          <Select
            label={t('rooms.drawer.roomType')}
            value={draftType}
            options={typeOptions}
            onChange={(val) => setDraftType(val as RoomType)}
          />
        </div>

        <div className="room-details-drawer__field room-details-drawer__form-full">
          <Select
            label={t('rooms.drawer.guestCount')}
            value={guestCount}
            options={guestCountOptions}
            onChange={setGuestCount}
          />
        </div>

        <div className="room-details-drawer__field room-details-drawer__form-full">
          <label htmlFor="room-guest-name">{t('rooms.drawer.guestName')}</label>
          <input
            id="room-guest-name"
            className="room-details-drawer__input"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder={t('rooms.table.noGuest')}
          />
        </div>

        <div className="room-details-drawer__field room-details-drawer__form-full">
          <label htmlFor="room-national-id">{t('rooms.drawer.nationalId')}</label>
          <input
            id="room-national-id"
            className="room-details-drawer__input"
            type="text"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
          />
        </div>

        <div className="room-details-drawer__field">
          <label htmlFor="room-phone">{t('rooms.drawer.phone')}</label>
          <input
            id="room-phone"
            className="room-details-drawer__input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ direction: 'ltr' }}
          />
        </div>
        <div className="room-details-drawer__field">
          <Select
            label={t('rooms.drawer.paymentStatus')}
            value={paymentStatus}
            options={paymentOptions}
            onChange={setPaymentStatus}
          />
        </div>

        <div className="room-details-drawer__field">
          <label htmlFor="room-arrival-date">{t('rooms.drawer.arrivalDate')}</label>
          <input
            id="room-arrival-date"
            className="room-details-drawer__input"
            type="date"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
          />
        </div>
        <div className="room-details-drawer__field">
          <label htmlFor="room-arrival-time">{t('rooms.drawer.arrivalTime')}</label>
          <input
            id="room-arrival-time"
            className="room-details-drawer__input"
            type="time"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
          />
        </div>

        <div className="room-details-drawer__field">
          <label htmlFor="room-departure-date">{t('rooms.drawer.departureDate')}</label>
          <input
            id="room-departure-date"
            className="room-details-drawer__input"
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
          />
        </div>
        <div className="room-details-drawer__field">
          <label htmlFor="room-departure-time">{t('rooms.drawer.departureTime')}</label>
          <input
            id="room-departure-time"
            className="room-details-drawer__input"
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
          />
        </div>
      </section>

      {/* Guest Info Section */}
      <section className="room-details-drawer__card-section">
        <h3 className="room-details-drawer__section-title">
          <UserRound aria-hidden="true" />
          {t('rooms.drawer.guestInfo')}
        </h3>
        <div className="room-details-drawer__guest-list">
          <div className="room-details-drawer__guest-item">
            <span className="room-details-drawer__guest-label">{t('rooms.drawer.guestName')}</span>
            <span className="room-details-drawer__guest-val">{displayedGuestName}</span>
          </div>
          <div className="room-details-drawer__guest-item">
            <span className="room-details-drawer__guest-label">{t('rooms.drawer.nationalId')}</span>
            <span className="room-details-drawer__guest-val">{nationalId}</span>
          </div>
          <div className="room-details-drawer__guest-item">
            <span className="room-details-drawer__guest-label">{t('rooms.drawer.phone')}</span>
            <span className="room-details-drawer__guest-val">{phone}</span>
          </div>
          <div className="room-details-drawer__guest-item">
            <span className="room-details-drawer__guest-label">{t('rooms.drawer.roomType')}</span>
            <span className="room-details-drawer__guest-val">
              {draftType === 'vip' ? 'VIP' : t('rooms.type.standard')}
            </span>
          </div>
          <div className="room-details-drawer__guest-item">
            <span className="room-details-drawer__guest-label">{t('rooms.drawer.currentStatus')}</span>
            <span className="room-details-drawer__guest-val">{t(`rooms.status.${draftStatus}`)}</span>
          </div>
          <div className="room-details-drawer__guest-item">
            <span className="room-details-drawer__guest-label">{t('rooms.drawer.paymentStatus')}</span>
            <span className="room-details-drawer__guest-val">{t(`rooms.drawer.${paymentStatus}`)}</span>
          </div>
        </div>
      </section>

      {/* Room Log Section */}
      <section className="room-details-drawer__card-section">
        <h3 className="room-details-drawer__section-title">
          <NotebookText aria-hidden="true" />
          {t('rooms.drawer.roomLog')}
        </h3>
        <div className="room-details-drawer__timeline">
          {room.log.length > 0 ? (
            room.log.map((item) => (
              <div key={item.id} className="room-details-drawer__timeline-item">
                <span className="room-details-drawer__timeline-dot" aria-hidden="true" />
                <span className="room-details-drawer__timeline-title">{t(item.titleKey)}</span>
                <span className="room-details-drawer__timeline-time">
                  {formatRelativeTime(item.time, language)}
                </span>
              </div>
            ))
          ) : (
            <p className="room-details-drawer__empty-log">{t('rooms.drawer.logEmpty')}</p>
          )}
        </div>
      </section>

      {/* Reports & Action Cards */}
      <div className="room-details-drawer__action-card">
        <div className="room-details-drawer__action-info">
          <span className="room-details-drawer__action-icon">
            <Sparkles size={20} aria-hidden="true" />
          </span>
          <div className="room-details-drawer__action-text">
            <span className="room-details-drawer__action-title">{t('rooms.drawer.cleaningRequests')}</span>
            <span className="room-details-drawer__action-sub">{t('rooms.drawer.cleaningSubtitle')}</span>
          </div>
        </div>
        <button type="button" className="room-details-drawer__pdf-btn">PDF</button>
      </div>

      <div className="room-details-drawer__action-card">
        <div className="room-details-drawer__action-info">
          <span className="room-details-drawer__action-icon">
            <Wrench size={20} aria-hidden="true" />
          </span>
          <div className="room-details-drawer__action-text">
            <span className="room-details-drawer__action-title">{t('rooms.drawer.maintenanceLog')}</span>
            <span className="room-details-drawer__action-sub">{t('rooms.drawer.maintenanceSubtitle')}</span>
          </div>
        </div>
        <button type="button" className="room-details-drawer__pdf-btn">PDF</button>
      </div>

      <div className="room-details-drawer__action-card">
        <div className="room-details-drawer__action-info">
          <span className="room-details-drawer__action-icon">
            <CreditCard size={20} aria-hidden="true" />
          </span>
          <div className="room-details-drawer__action-text">
            <span className="room-details-drawer__action-title">{t('rooms.drawer.paymentsLog')}</span>
            <span className="room-details-drawer__action-sub">{t('rooms.drawer.paymentsSubtitle')}</span>
          </div>
        </div>
        <button type="button" className="room-details-drawer__pdf-btn">PDF</button>
      </div>
    </Drawer>
  );
}

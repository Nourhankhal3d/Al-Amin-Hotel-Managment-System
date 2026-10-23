import { getTranslation, type Language } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import type { Room } from '../types/room.types';
import { getRoomGuestName } from '../utils/roomDisplay';
import './RoomCard.css';

interface RoomCardProps {
  room: Room;
  language: Language;
  onOpen: (roomId: string) => void;
}

export function RoomCard({ room, language, onOpen }: RoomCardProps) {
  const t = (key: string) => getTranslation(language, key);
  const number = formatNumber(Number(room.number), language);

  function footerText(): string {
    if (room.status === 'occupied') {
      return room.guestName
        ? getRoomGuestName(room, language)
        : t('rooms.guest.roomNumber').replace('{number}', number);
    }
    if (room.status === 'reserved') return t('rooms.guest.confirmedReservation');
    return '—';
  }

  return (
    <button
      type="button"
      className={`room-card room-card--${room.status}`}
      aria-label={`${t('rooms.drawer.roomTitle').replace('{number}', number)} - ${t(`rooms.status.${room.status}`)}`}
      onClick={() => onOpen(room.id)}
    >
      <span className="room-card__top">
                <span className="room-card__id">
          <span className="room-card__label">{t('rooms.card.room')}</span>
          <span className="room-card__number">{number}</span>
        </span>
        {room.type === 'vip' && <span className="room-card__vip">VIP</span>}
      </span>
      <span className="room-card__status">
        <span className="room-card__dot" aria-hidden="true" />
        {t(`rooms.status.${room.status}`)}
      </span>
      <span className="room-card__meta">
        <span>{t('rooms.table.floor')} {t(`rooms.floor.${room.floor}`)}</span>
        <span>{t(`rooms.type.${room.type}`)}</span>
      </span>
      <span className="room-card__footer">{footerText()}</span>
    </button>
  );
}
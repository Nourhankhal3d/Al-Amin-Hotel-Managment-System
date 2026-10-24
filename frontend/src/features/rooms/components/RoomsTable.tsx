import { Card } from '../../../components/ui/Card';
import { Pagination } from '../../../components/ui/Pagination';
import type { Language } from '../../../core/i18n';
import { getTranslation } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import { getRoomGuestName } from '../utils/roomDisplay';
import type { Room } from '../types/room.types';
import './RoomsTable.css';

interface RoomsTableProps {
  rooms: Room[];
  totalRooms: number;
  language: Language;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenRoom: (roomId: string) => void;
}

export function RoomsTable({
  rooms,
  totalRooms,
  language,
  page,
  totalPages,
  onPageChange,
  onOpenRoom,
}: RoomsTableProps) {
  const t = (key: string) => getTranslation(language, key);
  const subtitle = t('rooms.table.subtitle').replace(
    '{count}',
    formatNumber(totalRooms, language),
  );
  const pageLabel = t('rooms.table.page')
    .replace('{page}', formatNumber(page, language))
    .replace('{total}', formatNumber(totalPages, language));

  return (
    <Card className="rooms-table-card" id="rooms-table-card">
      <header className="rooms-table-card__header">
        <div>
          <h2>{t('rooms.table.title')}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="rooms-table-card__updated-badge">
          <span className="rooms-table-card__updated-dot" aria-hidden="true" />
          {t('rooms.table.updatedNow')}
        </span>
      </header>

      <div className="rooms-grid">
        {rooms.map((room) => {
          const guestName = getRoomGuestName(room, language);
          const isVip = room.type === 'vip';
          const statusClass = `room-card__status--${room.status}`;
          const dotClass = `room-card__status-dot--${room.status}`;

          return (
            <div
              key={room.id}
              className="room-card"
              role="button"
              tabIndex={0}
              onClick={() => onOpenRoom(room.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenRoom(room.id);
                }
              }}
              aria-label={`${t('rooms.table.roomNumber')} ${formatNumber(Number(room.number), language)}`}
            >
              <div className="room-card__header">
                {isVip ? (
                  <span className="room-card__vip-badge">VIP</span>
                ) : (
                  <span className="room-card__standard-tag">{t('rooms.type.standard')}</span>
                )}
                <span className="room-card__number">
                  {formatNumber(Number(room.number), language)}
                </span>
              </div>

              <div className={`room-card__status ${statusClass}`}>
                <span className={`room-card__status-dot ${dotClass}`} aria-hidden="true" />
                <span>{t(`rooms.status.${room.status}`)}</span>
              </div>

              <div className="room-card__meta">
                <span>{isVip ? 'VIP' : t('rooms.type.standard')}</span>
                <span>•</span>
                <span>{t(`rooms.floor.${room.floor}`)}</span>
              </div>

              <div className="room-card__guest">
                {guestName || t('rooms.table.noGuest')}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <footer className="rooms-table-card__footer">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageLabel={pageLabel}
            previousLabel={t('pagination.previous')}
            nextLabel={t('pagination.next')}
            navigationLabel={t('pagination.label')}
          />
        </footer>
      )}
    </Card>
  );
}

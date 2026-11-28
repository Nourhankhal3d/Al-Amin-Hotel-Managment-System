import { Card } from '../../../components/ui/Card';
import { getTranslation, type Language } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import type { Room } from '../types/room.types';
import { RoomCard } from './RoomCard';
import './RoomsTable.css';
import './RoomsGrid.css';

interface RoomsGridProps {
  rooms: Room[];
  language: Language;
  onOpenRoom: (roomId: string) => void;
}

// The hotel has one block of rooms per floor (1xx, 2xx, 3xx): show each floor as its own group
function groupByFloor(rooms: Room[]) {
  const groups = new Map<Room['floor'], Room[]>();
  rooms.forEach((room) => {
    const group = groups.get(room.floor);
    if (group) group.push(room);
    else groups.set(room.floor, [room]);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([floor, floorRooms]) => ({ floor, rooms: floorRooms }));
}

export function RoomsGrid({ rooms, language, onOpenRoom }: RoomsGridProps) {
  const t = (key: string) => getTranslation(language, key);
  const count = formatNumber(rooms.length, language);
  const summary = t('rooms.gridSubtitle').replace('{count}', count);
  const floors = groupByFloor(rooms);
  // "الدور الأول"; falls back to the card wording if a floor has no heading text
  const floorTitle = (floor: Room['floor']) => {
    const key = `rooms.floorHeading.${floor}`;
    const heading = t(key);
    return heading === key ? `${t('rooms.table.floor')} ${formatNumber(floor, language)}` : heading;
  };

  return (
    <Card className="rooms-table-card" id="rooms-grid-card">
      <header className="rooms-table-card__header">
        <div>
         <h2>{t('rooms.gridTitle')}</h2>
          <p>{summary}</p>
        </div>
        <span className="rooms-table-card__updated">{t('rooms.table.updatedNow')}</span>
      </header>
      {floors.map(({ floor, rooms: floorRooms }) => {
        const headingId = `rooms-floor-${floor}`;
        return (
          <section key={floor} className="rooms-floor" aria-labelledby={headingId}>
            <h3 id={headingId} className="rooms-floor__title">{floorTitle(floor)}</h3>
            <div className="rooms-grid">
              {floorRooms.map((room) => (
                <RoomCard key={room.id} room={room} language={language} onOpen={onOpenRoom} />
              ))}
            </div>
          </section>
        );
      })}
    </Card>
  );
}
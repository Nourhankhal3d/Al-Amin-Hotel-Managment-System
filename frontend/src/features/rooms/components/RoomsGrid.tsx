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

export function RoomsGrid({ rooms, language, onOpenRoom }: RoomsGridProps) {
  const t = (key: string) => getTranslation(language, key);
  const count = formatNumber(rooms.length, language);
  const summary = t('rooms.gridSubtitle').replace('{count}', count);

  return (
    <Card className="rooms-table-card" id="rooms-grid-card">
      <header className="rooms-table-card__header">
        <div>
         <h2>{t('rooms.gridTitle')}</h2>
          <p>{summary}</p>
        </div>
        <span className="rooms-table-card__updated">{t('rooms.table.updatedNow')}</span>
      </header>
      <div className="rooms-grid">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} language={language} onOpen={onOpenRoom} />
        ))}
      </div>
    </Card>
  );
}
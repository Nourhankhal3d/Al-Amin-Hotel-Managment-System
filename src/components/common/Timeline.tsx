import './Timeline.css';
import type { ReactNode } from 'react';
import './Timeline.css';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  renderItem?: (item: TimelineItem) => ReactNode;
  markerTone?: 'primary' | 'gold';
}

export function Timeline({ items, renderItem, markerTone = 'primary' }: TimelineProps) {
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={item.id} className="timeline__item">
          <span className="timeline__marker" />
          <div className="timeline__content">
            {renderItem ? renderItem(item) : (
              <>
                <strong className="timeline__title">{item.title}</strong>
                {item.description && <p className="timeline__description">{item.description}</p>}
              </>
            )}
          </div>
          {item.time && <time className="timeline__time">{item.time}</time>}
        </li>
      ))}
    </ol>
  );
}
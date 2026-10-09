import type { ReactNode } from 'react';
import './Timeline.css';

interface TimelineItem {
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
    <ol className={`ui-timeline ui-timeline--${markerTone}`}>
      {items.map((item) => (
        <li key={item.id}>
          <span className="ui-timeline__marker" />
          <div>{renderItem ? renderItem(item) : <><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}{item.time && <time>{item.time}</time>}</>}</div>
        </li>
      ))}
    </ol>
  );
}

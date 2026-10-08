import type { ReactNode } from 'react';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  renderItem?: (item: TimelineItem) => ReactNode;
}

export function Timeline({ items, renderItem }: TimelineProps) {
  return (
    <ol className="ui-timeline">
      {items.map((item) => (
        <li key={item.id}>
          <span className="ui-timeline__marker" />
          <div>{renderItem ? renderItem(item) : <><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}{item.time && <time>{item.time}</time>}</>}</div>
        </li>
      ))}
    </ol>
  );
}

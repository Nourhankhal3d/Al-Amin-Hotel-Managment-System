import { EmptyState } from '../../../components/common/EmptyState';
import { CheckIcon } from '../../../components/ui/Icons';
import type { ShiftEvent } from '../types/shift-report.types';

interface ShiftTimelineProps {
  events: ShiftEvent[];
}

/** Horizontal execution timeline matching the Figma shift report design. */
export function ShiftTimeline({ events }: ShiftTimelineProps) {
  if (events.length === 0) {
    return <EmptyState title="لا توجد أحداث بعد" description="ابدأ المناوبة لعرض سجل النشاط." />;
  }

  return (
    <ol className="al-steps">
      {events.map((event) => (
        <li key={event.id}>
          <span className="al-steps__icon"><CheckIcon /></span>
          {event.time && <span className="al-steps__time">{event.time}</span>}
          <strong>{event.title}</strong>
          {event.description && <p>{event.description}</p>}
        </li>
      ))}
    </ol>
  );
}

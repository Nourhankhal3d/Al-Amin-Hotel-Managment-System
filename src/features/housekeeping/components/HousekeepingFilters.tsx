import './HousekeepingFilters.css';
import { FilterBar } from '../../../components/common/FilterBar';
import { Button } from '../../../components/ui/Button';

// TEMP: texts and options live here until i18n and backend are ready
const LABELS = {
  search: 'ابحث بالغرفة أو نوع المهمة',
  status: 'الحالة',
  priority: 'الأولوية',
  all: 'الكل',
  reset: 'إعادة ضبط',
};

const STATUS_OPTIONS = ['معلّقة', 'قيد التنفيذ', 'مكتملة'];
const PRIORITY_OPTIONS = ['عادي', 'مرتفع', 'حرج'];

interface HousekeepingFiltersProps {
  query: string;
  status: string;
  priority: string;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onReset: () => void;
}

export function HousekeepingFilters({
  query,
  status,
  priority,
  onQueryChange,
  onStatusChange,
  onPriorityChange,
  onReset,
}: HousekeepingFiltersProps) {
  return (
    <FilterBar value={query} onChange={onQueryChange} placeholder={LABELS.search}>
      <label className="housekeeping-filters__field">
        <span>{LABELS.status}</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">{LABELS.all}</option>
          {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="housekeeping-filters__field">
        <span>{LABELS.priority}</span>
        <select value={priority} onChange={(event) => onPriorityChange(event.target.value)}>
          <option value="">{LABELS.all}</option>
          {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <Button variant="ghost" onClick={onReset}>{LABELS.reset}</Button>
    </FilterBar>
  );
}
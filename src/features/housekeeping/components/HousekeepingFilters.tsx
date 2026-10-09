import './HousekeepingFilters.css';
import { FilterBar } from '../../../components/common/FilterBar';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../core/i18n/useLanguage';
import {
  PRIORITY_LABEL_KEY,
  PRIORITY_OPTIONS,
  STATUS_LABEL_KEY,
  STATUS_OPTIONS,
} from '../constants/housekeeping.constants';

interface HousekeepingFiltersProps {
  query: string;
  status: string;
  priority: string;
  floor: string;
  floorOptions: string[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onFloorChange: (value: string) => void;
  onReset: () => void;
}

export function HousekeepingFilters({
  query,
  status,
  priority,
  floor,
  floorOptions,
  onQueryChange,
  onStatusChange,
  onPriorityChange,
  onFloorChange,
  onReset,
}: HousekeepingFiltersProps) {
  const { t } = useLanguage();

  return (
    <FilterBar
      className="housekeeping-filters"
      value={query}
      onChange={onQueryChange}
      placeholder={t('hkSearch')}
    >
      <label className="housekeeping-filters__field">
        <span>{t('statusLabel')}</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">{t('filterAll')}</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>{t(STATUS_LABEL_KEY[option])}</option>
          ))}
        </select>
      </label>
      <label className="housekeeping-filters__field">
        <span>{t('priorityLabel')}</span>
        <select value={priority} onChange={(event) => onPriorityChange(event.target.value)}>
          <option value="">{t('filterAll')}</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option} value={option}>{t(PRIORITY_LABEL_KEY[option])}</option>
          ))}
        </select>
      </label>
      <label className="housekeeping-filters__field">
        <span>{t('floorLabel')}</span>
        <select value={floor} onChange={(event) => onFloorChange(event.target.value)}>
          <option value="">{t('filterAll')}</option>
          {floorOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <Button variant="ghost" onClick={onReset}>{t('filterReset')}</Button>
    </FilterBar>
  );
}
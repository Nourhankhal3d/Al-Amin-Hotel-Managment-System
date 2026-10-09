import './MaintenanceFilters.css';
import { FilterBar } from '../../../components/common/FilterBar';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../core/i18n/useLanguage';
import {
  PRIORITY_LABEL_KEY,
  PRIORITY_OPTIONS,
  STATUS_LABEL_KEY,
  STATUS_OPTIONS,
} from '../constants/maintenance.constants';

interface MaintenanceFiltersProps {
  query: string;
  status: string;
  priority: string;
  room: string;
  roomOptions: string[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onRoomChange: (value: string) => void;
  onReset: () => void;
}

export function MaintenanceFilters({
  query,
  status,
  priority,
  room,
  roomOptions,
  onQueryChange,
  onStatusChange,
  onPriorityChange,
  onRoomChange,
  onReset,
}: MaintenanceFiltersProps) {
  const { t } = useLanguage();

  return (
    <FilterBar value={query} onChange={onQueryChange} placeholder={t('mtSearch')}>
      <label className="maintenance-filters__field">
        <span>{t('statusLabel')}</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">{t('filterAll')}</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>{t(STATUS_LABEL_KEY[option])}</option>
          ))}
        </select>
      </label>
      <label className="maintenance-filters__field">
        <span>{t('priorityLabel')}</span>
        <select value={priority} onChange={(event) => onPriorityChange(event.target.value)}>
          <option value="">{t('filterAll')}</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option} value={option}>{t(PRIORITY_LABEL_KEY[option])}</option>
          ))}
        </select>
      </label>
      <label className="maintenance-filters__field">
        <span>{t('roomNumberLabel')}</span>
        <select value={room} onChange={(event) => onRoomChange(event.target.value)}>
          <option value="">{t('filterAll')}</option>
          {roomOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <Button variant="ghost" onClick={onReset}>{t('filterReset')}</Button>
    </FilterBar>
  );
}
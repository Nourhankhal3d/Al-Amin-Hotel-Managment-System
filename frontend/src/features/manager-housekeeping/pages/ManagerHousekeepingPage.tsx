import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, Clock, FileText, Plus, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { SearchBar } from '../../../components/common/SearchBar';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { StatCard } from '../../../components/ui/StatCard';
import { useToast } from '../../../components/ui/ToastContext';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatRelativeTime } from '../../../utils/date';
import { exportCsv } from '../../../utils/exportCsv';
import { formatNumber } from '../../../utils/format';
import { HousekeepingTaskDrawer } from '../components/HousekeepingTaskDrawer';
import { HousekeepingTasksTable } from '../components/HousekeepingTasksTable';
import { NewTaskDrawer } from '../components/NewTaskDrawer';
import {
  HIGH_PRIORITIES,
  HOUSEKEEPING_I18N,
  HOUSEKEEPING_PAGE_SIZE,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from '../constants/housekeeping.constants';
import {
  useCleaners,
  useCreateHousekeepingTask,
  useHousekeepingTasks,
  useRooms,
  useUpdateHousekeepingTask,
} from '../hooks/useManagerHousekeeping';
import { toCreateBody, type NewTaskValues } from '../schemas/newTask.schema';
import type {
  HousekeepingFilterName,
  HousekeepingFilters,
  HousekeepingPriority,
  HousekeepingStatus,
  HousekeepingTask,
  HousekeepingTaskAssign,
  RoomOption,
} from '../types/manager-housekeeping.types';
import { apiErrorText, createErrorText } from '../utils/apiErrorText';
import { floorOf, formatRoom, formatTime, isSameDay, normalizeSearch, pluralText, twoDigits } from '../utils/housekeepingDisplay';
import './ManagerHousekeepingPage.css';

// URL params: q, cleaner, status, priority, floor, page — plus id (details drawer) and new=1 (new task drawer)
function parseFilters(params: URLSearchParams): HousekeepingFilters {
  const status = params.get('status') ?? '';
  const priority = params.get('priority') ?? '';
  const page = Number.parseInt(params.get('page') ?? '1', 10);
  return {
    q: params.get('q') ?? '',
    cleaner: params.get('cleaner') ?? '',
    status: (STATUS_OPTIONS as string[]).includes(status) ? status as HousekeepingStatus : '',
    priority: (PRIORITY_OPTIONS as string[]).includes(priority) ? priority as HousekeepingPriority : '',
    floor: /^\d+$/.test(params.get('floor') ?? '') ? params.get('floor') ?? '' : '',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

function matchesFilters(task: HousekeepingTask, filters: HousekeepingFilters, floor: number | null): boolean {
  const search = normalizeSearch(filters.q);
  const matchesQuery = !search
    || normalizeSearch(task.roomNumber).includes(search)
    || normalizeSearch(task.cleanerName ?? '').includes(search);
  return matchesQuery
    && (!filters.cleaner || task.cleanerId === filters.cleaner)
    && (!filters.status || task.status === filters.status)
    && (!filters.priority || task.priority === filters.priority)
    && (!filters.floor || String(floor) === filters.floor);
}

/** Newest first, as in the design */
function byNewest(a: HousekeepingTask, b: HousekeepingTask): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function ManagerHousekeepingPage() {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${HOUSEKEEPING_I18N}.${key}`), [translate]);
  const toast = useToast();
  const tableRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [searchDraft, setSearchDraft] = useState(filters.q);
  const debouncedSearch = useDebounce(searchDraft, 300);
  // Refreshes the "last updated" line every 30 seconds
  const [now, setNow] = useState(() => Date.now());

  const tasksQuery = useHousekeepingTasks();
  const cleanersQuery = useCleaners();
  const roomsQuery = useRooms();
  const updateTask = useUpdateHousekeepingTask();
  const createTask = useCreateHousekeepingTask();
  const tasks = useMemo(() => [...(tasksQuery.data ?? [])].sort(byNewest), [tasksQuery.data]);
  const cleaners = useMemo(() => cleanersQuery.data ?? [], [cleanersQuery.data]);
  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  // The task list has no floor or guest: both come from the rooms list
  const roomsById = useMemo(() => new Map<string, RoomOption>(rooms.map((room) => [room.roomId, room])), [rooms]);
  const taskFloor = useCallback(
    (task: HousekeepingTask) => floorOf(task.roomNumber, roomsById.get(task.roomId)?.floor),
    [roomsById],
  );
  const floors = useMemo(() => [...new Set([...rooms.map((room) => floorOf(room.roomNumber, room.floor)), ...tasks.map(taskFloor)])]
    .filter((floor): floor is number => floor !== null)
    .sort((a, b) => a - b), [rooms, tasks, taskFloor]);

  const selectedTask = tasks.find((task) => task.id === searchParams.get('id')) ?? null;
  const isNewTaskOpen = searchParams.get('new') === '1';

  const updateParams = useCallback((changes: Record<string, string | null>, replace = false) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [name, value] of Object.entries(changes)) {
        if (value === null || value === '') next.delete(name);
        else next.set(name, value);
      }
      return next;
    }, { replace });
  }, [setSearchParams]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Keep the search box in sync when the URL changes (back button, reset)
  useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  // Write the search to the URL 300ms after the user stops typing
  useEffect(() => {
    if (debouncedSearch === filters.q || searchDraft !== debouncedSearch) return;
    updateParams({ q: debouncedSearch.trim(), page: null }, true);
  }, [debouncedSearch, filters.q, searchDraft, updateParams]);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => matchesFilters(task, filters, taskFloor(task))),
    [tasks, filters, taskFloor],
  );
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / HOUSEKEEPING_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageTasks = filteredTasks.slice((page - 1) * HOUSEKEEPING_PAGE_SIZE, page * HOUSEKEEPING_PAGE_SIZE);

  // The cards count every loaded task, not only the filtered ones
  const stats = useMemo(() => {
    const today = new Date(now);
    const pending = tasks.filter((task) => task.status === 'PENDING');
    return {
      today: tasks.filter((task) => isSameDay(new Date(task.createdAt), today)).length,
      pending: pending.length,
      completed: tasks.length - pending.length,
      // Still waiting and urgent: what the manager should look at first
      highPriority: pending.filter((task) => HIGH_PRIORITIES.includes(task.priority)).length,
    };
  }, [tasks, now]);

  const cardValue = (value: number) => twoDigits(value, language);

  function changeFilter(name: HousekeepingFilterName, value: string) {
    updateParams({ [name]: value, page: null });
  }

  function resetFilters() {
    setSearchDraft('');
    updateParams({ q: null, cleaner: null, status: null, priority: null, floor: null, page: null });
  }

  function changePage(nextPage: number) {
    updateParams({ page: nextPage > 1 ? String(nextPage) : null });
    window.setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  const closeDrawers = () => updateParams({ id: null, new: null });

  async function saveTask(changes: HousekeepingTaskAssign) {
    if (!selectedTask) return;
    if (Object.keys(changes).length === 0) {
      toast.notify(t('toastNoChanges'), 'info');
      closeDrawers();
      return;
    }
    try {
      await updateTask.mutateAsync({ id: selectedTask.id, body: changes });
      toast.notify(t('toastSaved').replace('{room}', formatRoom(selectedTask.roomNumber, language)), 'success');
      closeDrawers();
    } catch (error) {
      toast.notify(apiErrorText(error, t, language), 'error');
    }
  }

  async function addTask(values: NewTaskValues) {
    try {
      const created = await createTask.mutateAsync(toCreateBody(values, rooms, cleaners));
      toast.notify(t('toastAdded').replace('{room}', formatRoom(created.roomNumber, language)), 'success');
      closeDrawers();
    } catch (error) {
      toast.notify(createErrorText(error, t, language), 'error');
    }
  }

  function exportTasks() {
    const exported = exportCsv<HousekeepingTask>(filteredTasks, [
      { header: t('colRoom'), value: (task) => task.roomNumber },
      { header: t('colCleaner'), value: (task) => task.cleanerName ?? t('unassigned') },
      { header: t('colPriority'), value: (task) => t(`priorities.${task.priority}`) },
      { header: t('colStatus'), value: (task) => t(`statuses.${task.status}`) },
      { header: t('colLogged'), value: (task) => formatTime(task.createdAt, language) },
      { header: t('fields.guest'), value: (task) => roomsById.get(task.roomId)?.guestName ?? '' },
      { header: t('fields.notes'), value: (task) => task.notes },
    ], `housekeeping-${new Date().toISOString().slice(0, 10)}.csv`);
    if (exported) toast.notify(pluralText(t, 'toastExported', filteredTasks.length, language), 'success');
    else toast.notify(t('toastNothingToExport'), 'warning');
  }

  const hero = (withActions: boolean) => (
    <PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}>
      {withActions && (
        <>
          <Button variant="glass" onClick={exportTasks}>
            <FileText aria-hidden="true" />
            {t('export')}
          </Button>
          <Button variant="gold" onClick={() => updateParams({ new: '1', id: null })}>
            <Plus aria-hidden="true" />
            {t('assignTask')}
          </Button>
        </>
      )}
    </PageHero>
  );

  if (tasksQuery.isPending) {
    return <div className="feature-page manager-housekeeping">{hero(false)}<LoadingState label={t('loading')} /></div>;
  }

  if (tasksQuery.isError) {
    return (
      <div className="feature-page manager-housekeeping">
        {hero(false)}
        <ErrorState
          title={t('loadError')}
          message={getErrorMessage(tasksQuery.error, language)}
          action={<Button onClick={() => { void tasksQuery.refetch(); }}>{t('retry')}</Button>}
        />
      </div>
    );
  }

  const hasFilters = Boolean(filters.q || filters.cleaner || filters.status || filters.priority || filters.floor);
  const updatedText = t('lastUpdated').replace('{time}', formatRelativeTime(new Date(tasksQuery.dataUpdatedAt), language, now));

  return (
    <div className="feature-page manager-housekeeping">
      {hero(true)}

      {/* Same order as the design: in Arabic "pending" sits on the right */}
      <div className="stat-grid manager-housekeeping__stats">
        <StatCard label={t('stats.pending')} value={cardValue(stats.pending)} icon={<Clock size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.completed')} value={cardValue(stats.completed)} icon={<Check size={20} aria-hidden="true" />} tone="green" />
        <StatCard label={t('stats.highPriority')} value={cardValue(stats.highPriority)} icon={<Wrench size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.today')} value={cardValue(stats.today)} icon={<CalendarDays size={20} aria-hidden="true" />} tone="gold" />
      </div>

      <Card className="filters-card manager-housekeeping__filters">
        <SearchBar value={searchDraft} onChange={setSearchDraft} placeholder={t('searchPlaceholder')} />
        <div className="manager-housekeeping__selects">
          <Select
            value={filters.cleaner}
            label={t('filterCleaner')}
            options={[{ value: '', label: t('all') }, ...cleaners.map((cleaner) => ({ value: cleaner.id, label: cleaner.name }))]}
            onChange={(value) => changeFilter('cleaner', value)}
          />
          <Select
            value={filters.status}
            label={t('filterStatus')}
            options={[{ value: '', label: t('all') }, ...STATUS_OPTIONS.map((status) => ({ value: status, label: t(`statuses.${status}`) }))]}
            onChange={(value) => changeFilter('status', value)}
          />
          <Select
            value={filters.priority}
            label={t('filterPriority')}
            options={[{ value: '', label: t('all') }, ...PRIORITY_OPTIONS.map((priority) => ({ value: priority, label: t(`priorities.${priority}`) }))]}
            onChange={(value) => changeFilter('priority', value)}
          />
          <Select
            value={filters.floor}
            label={t('filterFloor')}
            options={[{ value: '', label: t('all') }, ...floors.map((floor) => ({
              value: String(floor),
              label: t('floorLabel').replace('{floor}', formatNumber(floor, language)),
            }))]}
            onChange={(value) => changeFilter('floor', value)}
          />
          <button type="button" className="filter-bar__reset" onClick={resetFilters}>{t('reset')}</button>
        </div>
      </Card>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title={hasFilters ? t('emptyTitle') : t('emptyNoTasks')}
          description={hasFilters ? t('emptyDescription') : t('emptyNoTasksHint')}
          action={hasFilters
            ? <Button variant="secondary" onClick={resetFilters}>{t('reset')}</Button>
            : <Button onClick={() => updateParams({ new: '1' })}>{t('assignTask')}</Button>}
        />
      ) : (
        <div ref={tableRef}>
          <HousekeepingTasksTable
            tasks={pageTasks}
            page={page}
            totalPages={totalPages}
            updatedText={updatedText}
            onPageChange={changePage}
            onOpen={(id) => updateParams({ id, new: null })}
          />
        </div>
      )}

      <HousekeepingTaskDrawer
        task={selectedTask}
        guestName={selectedTask ? roomsById.get(selectedTask.roomId)?.guestName ?? null : null}
        cleaners={cleaners}
        isSaving={updateTask.isPending}
        onClose={closeDrawers}
        onSave={saveTask}
      />
      <NewTaskDrawer
        open={isNewTaskOpen}
        rooms={rooms}
        cleaners={cleaners}
        isSaving={createTask.isPending}
        onClose={closeDrawers}
        onSubmit={addTask}
      />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CalendarDays, Check, Clock, FileText, Plus, Timer, Wrench } from 'lucide-react';
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
import { useLanguage } from '../../../core/i18n/useLanguage';
import { useDebounce } from '../../../hooks/useDebounce';
import { exportCsv } from '../../../utils/exportCsv';
import { MaintenanceTicketDrawer } from '../components/MaintenanceTicketDrawer';
import { MaintenanceTicketsTable } from '../components/MaintenanceTicketsTable';
import { NewTicketDrawer } from '../components/NewTicketDrawer';
import {
  ACTIVE_STATUSES,
  MAINTENANCE_I18N,
  MAINTENANCE_PAGE_SIZE,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  UNASSIGNED,
} from '../constants/maintenance.constants';
import {
  useCreateMaintenanceTicket,
  useMaintenanceTickets,
  useRooms,
  useTechnicians,
  useUpdateMaintenanceTicket,
} from '../hooks/useManagerMaintenance';
import { toCreateBody, type NewTicketValues } from '../schemas/newTicket.schema';
import type {
  MaintenanceFilterName,
  MaintenanceFilters,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceTicket,
  MaintenanceTicketUpdate,
} from '../types/manager-maintenance.types';
import {
  formatCode,
  formatMinutes,
  formatRoom,
  formatTime,
  isToday,
  normalizeSearch,
  pluralText,
  twoDigits,
} from '../utils/maintenanceDisplay';
import { apiErrorText } from '../utils/apiErrorText';
import './ManagerMaintenancePage.css';

// URL params: q, room, priority, status, technician, page — plus id (details drawer) and ticket=new (new ticket drawer)
function parseFilters(params: URLSearchParams): MaintenanceFilters {
  const status = params.get('status') ?? '';
  const priority = params.get('priority') ?? '';
  const page = Number.parseInt(params.get('page') ?? '1', 10);
  return {
    q: params.get('q') ?? '',
    room: params.get('room') ?? '',
    priority: (PRIORITY_OPTIONS as string[]).includes(priority) ? priority as MaintenancePriority : '',
    status: (STATUS_OPTIONS as string[]).includes(status) ? status as MaintenanceStatus : '',
    technician: params.get('technician') ?? '',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

function matchesFilters(ticket: MaintenanceTicket, filters: MaintenanceFilters): boolean {
  const search = normalizeSearch(filters.q);
  const matchesQuery = !search
    || normalizeSearch(ticket.roomNumber).includes(search)
    || normalizeSearch(ticket.issue).includes(search)
    || normalizeSearch(ticket.description).includes(search)
    || normalizeSearch(ticket.code).includes(search);
  const matchesTechnician = !filters.technician
    || (filters.technician === UNASSIGNED ? !ticket.technicianId : ticket.technicianId === filters.technician);
  return matchesQuery
    && matchesTechnician
    && (!filters.room || ticket.roomNumber === filters.room)
    && (!filters.priority || ticket.priority === filters.priority)
    && (!filters.status || ticket.status === filters.status);
}

/** Newest first, as in the design */
function byNewest(a: MaintenanceTicket, b: MaintenanceTicket): number {
  return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
}

export function ManagerMaintenancePage() {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${MAINTENANCE_I18N}.${key}`), [translate]);
  const toast = useToast();
  const tableRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [searchDraft, setSearchDraft] = useState(filters.q);
  const debouncedSearch = useDebounce(searchDraft, 300);
  // Refreshes the "last update" column every 30 seconds
  const [now, setNow] = useState(() => Date.now());

  const ticketsQuery = useMaintenanceTickets();
  const techniciansQuery = useTechnicians();
  const roomsQuery = useRooms();
  const updateTicket = useUpdateMaintenanceTicket();
  const createTicket = useCreateMaintenanceTicket();
  const tickets = useMemo(() => [...(ticketsQuery.data ?? [])].sort(byNewest), [ticketsQuery.data]);
  const technicians = useMemo(() => techniciansQuery.data ?? [], [techniciansQuery.data]);
  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  // The room filter lists only rooms that have tickets
  const ticketRooms = useMemo(
    () => [...new Set(tickets.map((ticket) => ticket.roomNumber))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })),
    [tickets],
  );

  const selectedTicket = tickets.find((ticket) => ticket.id === searchParams.get('id')) ?? null;
  const isNewOpen = searchParams.get('ticket') === 'new';

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

  const filteredTickets = useMemo(() => tickets.filter((ticket) => matchesFilters(ticket, filters)), [tickets, filters]);
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / MAINTENANCE_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const pageTickets = filteredTickets.slice((page - 1) * MAINTENANCE_PAGE_SIZE, page * MAINTENANCE_PAGE_SIZE);

  // The cards count every ticket, not only the filtered ones
  const stats = useMemo(() => {
    const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED');
    const durations = resolved
      .map((ticket) => (ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() - new Date(ticket.reportedAt).getTime() : NaN))
      .filter((value) => Number.isFinite(value) && value >= 0);
    return {
      total: tickets.length,
      critical: tickets.filter((ticket) => ticket.priority === 'RUSH' && ticket.status !== 'RESOLVED').length,
      pending: tickets.filter((ticket) => ticket.status === 'OPEN').length,
      resolved: resolved.length,
      today: tickets.filter((ticket) => isToday(ticket.reportedAt, now)).length,
      averageMinutes: durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length / 60_000 : null,
    };
  }, [now, tickets]);

  const cardValue = (value: number) => twoDigits(value, language);
  const activeTickets = filteredTickets.filter((ticket) => ACTIVE_STATUSES.includes(ticket.status)).length;

  function changeFilter(name: MaintenanceFilterName, value: string) {
    updateParams({ [name]: value, page: null });
  }

  function resetFilters() {
    setSearchDraft('');
    updateParams({ q: null, room: null, priority: null, status: null, technician: null, page: null });
  }

  function changePage(nextPage: number) {
    updateParams({ page: nextPage > 1 ? String(nextPage) : null });
    window.setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  const closeDrawers = () => updateParams({ id: null, ticket: null });

  async function saveTicket(changes: MaintenanceTicketUpdate) {
    if (!selectedTicket) return;
    if (Object.keys(changes).length === 0) {
      toast.notify(t('toastNoChanges'), 'info');
      closeDrawers();
      return;
    }
    try {
      await updateTicket.mutateAsync({ id: selectedTicket.id, body: changes });
      toast.notify(t('toastSaved').replace('{code}', formatCode(selectedTicket.code, language)), 'success');
      closeDrawers();
    } catch (error) {
      toast.notify(apiErrorText(error, t, language), 'error');
    }
  }

  async function logTicket(values: NewTicketValues) {
    try {
      const created = await createTicket.mutateAsync(toCreateBody(values, rooms));
      toast.notify(t('toastCreated').replace('{code}', formatCode(created.code, language)), 'success');
      closeDrawers();
    } catch (error) {
      toast.notify(apiErrorText(error, t, language), 'error');
    }
  }

  function exportTickets() {
    const exported = exportCsv<MaintenanceTicket>(filteredTickets, [
      { header: t('colCode'), value: (ticket) => ticket.code },
      { header: t('colRoom'), value: (ticket) => ticket.roomNumber },
      { header: t('colIssue'), value: (ticket) => ticket.issue },
      { header: t('colPriority'), value: (ticket) => t(`priorities.${ticket.priority}`) },
      { header: t('colStatus'), value: (ticket) => t(`statuses.${ticket.status}`) },
      { header: t('colTechnician'), value: (ticket) => ticket.technicianName ?? t('unassigned') },
      { header: t('colReported'), value: (ticket) => formatTime(ticket.reportedAt, language) },
      { header: t('fields.expected'), value: (ticket) => (ticket.expectedResolutionAt ? formatTime(ticket.expectedResolutionAt, language) : '') },
      { header: t('fields.description'), value: (ticket) => ticket.description },
    ], `maintenance-${new Date().toISOString().slice(0, 10)}.csv`);
    if (exported) toast.notify(pluralText(t, 'toastExported', filteredTickets.length, language), 'success');
    else toast.notify(t('toastNothingToExport'), 'warning');
  }

  const hero = (withActions: boolean) => (
    <PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}>
      {withActions && (
        <>
          <Button variant="glass" onClick={exportTickets}>
            <FileText aria-hidden="true" />
            {t('export')}
          </Button>
          <Button variant="gold" onClick={() => updateParams({ ticket: 'new', id: null })}>
            <Plus aria-hidden="true" />
            {t('newTicket')}
          </Button>
        </>
      )}
    </PageHero>
  );

  if (ticketsQuery.isPending) {
    return <div className="feature-page manager-maintenance">{hero(false)}<LoadingState label={t('loading')} /></div>;
  }

  if (ticketsQuery.isError) {
    return (
      <div className="feature-page manager-maintenance">
        {hero(false)}
        <ErrorState
          title={t('loadError')}
          message={apiErrorText(ticketsQuery.error, t, language)}
          action={<Button onClick={() => { void ticketsQuery.refetch(); }}>{t('retry')}</Button>}
        />
      </div>
    );
  }

  const hasFilters = Boolean(filters.q || filters.room || filters.priority || filters.status || filters.technician);

  return (
    <div className="feature-page manager-maintenance">
      {hero(true)}

      {/* Same order as the design: in Arabic "total" sits on the right of the first row */}
      <div className="stat-grid manager-maintenance__stats">
        <StatCard label={t('stats.total')} value={cardValue(stats.total)} icon={<Wrench size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.critical')} value={cardValue(stats.critical)} icon={<Bell size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.pending')} value={cardValue(stats.pending)} icon={<Clock size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.resolved')} value={cardValue(stats.resolved)} icon={<Check size={20} aria-hidden="true" />} tone="green" />
        <StatCard label={t('stats.today')} value={cardValue(stats.today)} icon={<CalendarDays size={20} aria-hidden="true" />} tone="green" />
        <StatCard
          label={t('stats.average')}
          value={stats.averageMinutes === null ? '—' : formatMinutes(stats.averageMinutes, t, language)}
          icon={<Timer size={20} aria-hidden="true" />}
          tone="gold"
        />
      </div>

      <Card className="filters-card manager-maintenance__filters">
        <SearchBar value={searchDraft} onChange={setSearchDraft} placeholder={t('searchPlaceholder')} />
        <div className="manager-maintenance__selects">
          <Select
            value={filters.room}
            label={t('filterRoom')}
            options={[{ value: '', label: t('all') }, ...ticketRooms.map((room) => ({ value: room, label: formatRoom(room, language) }))]}
            onChange={(value) => changeFilter('room', value)}
          />
          <Select
            value={filters.priority}
            label={t('filterPriority')}
            options={[{ value: '', label: t('all') }, ...PRIORITY_OPTIONS.map((priority) => ({ value: priority, label: t(`priorities.${priority}`) }))]}
            onChange={(value) => changeFilter('priority', value)}
          />
          <Select
            value={filters.status}
            label={t('filterStatus')}
            options={[{ value: '', label: t('all') }, ...STATUS_OPTIONS.map((status) => ({ value: status, label: t(`statuses.${status}`) }))]}
            onChange={(value) => changeFilter('status', value)}
          />
          <Select
            value={filters.technician}
            label={t('filterTechnician')}
            options={[
              { value: '', label: t('all') },
              ...technicians.map((technician) => ({ value: technician.id, label: technician.name })),
              { value: UNASSIGNED, label: t('unassigned') },
            ]}
            onChange={(value) => changeFilter('technician', value)}
          />
          <button type="button" className="filter-bar__reset" onClick={resetFilters}>{t('reset')}</button>
        </div>
      </Card>

      {filteredTickets.length === 0 ? (
        <EmptyState
          title={hasFilters ? t('emptyTitle') : t('emptyNoTickets')}
          description={hasFilters ? t('emptyDescription') : t('emptyNoTicketsHint')}
          action={hasFilters
            ? <Button variant="secondary" onClick={resetFilters}>{t('reset')}</Button>
            : <Button onClick={() => updateParams({ ticket: 'new' })}>{t('newTicket')}</Button>}
        />
      ) : (
        <div ref={tableRef}>
          <MaintenanceTicketsTable
            tickets={pageTickets}
            totalTickets={filteredTickets.length}
            activeTickets={activeTickets}
            page={page}
            totalPages={totalPages}
            now={now}
            onPageChange={changePage}
            onOpen={(id) => updateParams({ id, ticket: null })}
          />
        </div>
      )}

      <MaintenanceTicketDrawer
        ticket={selectedTicket}
        guestName={selectedTicket ? rooms.find((room) => room.roomId === selectedTicket.roomId)?.guestName ?? null : null}
        technicians={technicians}
        isSaving={updateTicket.isPending}
        now={now}
        onClose={closeDrawers}
        onSave={saveTicket}
      />
      <NewTicketDrawer
        open={isNewOpen}
        rooms={rooms}
        technicians={technicians}
        isSaving={createTicket.isPending}
        onClose={closeDrawers}
        onSubmit={logTicket}
      />
    </div>
  );
}

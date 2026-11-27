import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, FileText, NotebookText, Plus, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { SearchBar } from '../../../components/common/SearchBar';
import { TableCard } from '../../../components/common/TableCard';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Pagination } from '../../../components/ui/Pagination';
import { StatCard } from '../../../components/ui/StatCard';
import { useToast } from '../../../components/ui/ToastContext';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { useDebounce } from '../../../hooks/useDebounce';
import { exportCsv } from '../../../utils/exportCsv';
import { formatNumber } from '../../../utils/format';
import { NewSurveyDrawer, SurveyDetailsDrawer } from '../components/SurveyDrawer';
import { SurveysList } from '../components/SurveysList';
import { SURVEYS_I18N, SURVEYS_PAGE_SIZE } from '../constants/guestSurveys.constants';
import { useCreateGuestSurvey, useDepartingStays, useGuestSurveys } from '../hooks/useGuestSurveys';
import { toCreateBody, type NewSurveyValues } from '../schemas/newSurvey.schema';
import { RATING_QUESTIONS, type DepartingStay, type GuestSurvey } from '../types/guestSurveys.types';
import { apiErrorText } from '../utils/apiErrorText';
import {
  formatScore,
  normalizeSearch,
  pluralText,
  scoreLevel,
  surveyScore,
  twoDigits,
} from '../utils/surveyDisplay';
import './GuestSurveysPage.css';

/** Newest first */
function byNewest(a: GuestSurvey, b: GuestSurvey): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

// URL params: q (search), page, id (survey details) and new=1 (new survey drawer)
export function GuestSurveysPage() {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${SURVEYS_I18N}.${key}`), [translate]);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const pageParam = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const [searchDraft, setSearchDraft] = useState(query);
  const debouncedSearch = useDebounce(searchDraft, 300);
  const [now] = useState(() => Date.now());

  const surveysQuery = useGuestSurveys();
  const staysQuery = useDepartingStays();
  const createSurvey = useCreateGuestSurvey();
  const surveys = useMemo(() => [...(surveysQuery.data ?? [])].sort(byNewest), [surveysQuery.data]);
  const stays = useMemo(() => staysQuery.data ?? [], [staysQuery.data]);
  const selected = surveys.find((survey) => survey.id === searchParams.get('id')) ?? null;
  const isNewOpen = searchParams.get('new') === '1';

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

  // Keep the search box in sync when the URL changes (back button)
  useEffect(() => {
    setSearchDraft(query);
  }, [query]);

  // Write the search to the URL 300ms after the user stops typing
  useEffect(() => {
    if (debouncedSearch === query || searchDraft !== debouncedSearch) return;
    updateParams({ q: debouncedSearch.trim(), page: null }, true);
  }, [debouncedSearch, query, searchDraft, updateParams]);

  const filtered = useMemo(() => {
    const search = normalizeSearch(query);
    if (!search) return surveys;
    return surveys.filter((survey) => normalizeSearch(survey.guestName).includes(search)
      || normalizeSearch(survey.roomNumber).includes(search));
  }, [surveys, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / SURVEYS_PAGE_SIZE));
  const page = Math.min(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1, totalPages);
  const pageSurveys = filtered.slice((page - 1) * SURVEYS_PAGE_SIZE, page * SURVEYS_PAGE_SIZE);

  // The cards count every survey, not only the searched ones
  const stats = useMemo(() => {
    const scores = surveys.map((survey) => surveyScore(survey.ratings));
    const average = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
    return {
      total: surveys.length,
      average: Math.round(average * 10) / 10,
      complaints: surveys.filter((survey) => survey.hadProblem).length,
      suggestions: surveys.filter((survey) => survey.suggestions.trim()).length,
    };
  }, [surveys]);

  const closeDrawers = () => updateParams({ id: null, new: null });

  async function addSurvey(values: NewSurveyValues, stay: DepartingStay) {
    try {
      await createSurvey.mutateAsync(toCreateBody(values, stay));
      toast.notify(t('toastSaved').replace('{guest}', stay.guestName), 'success');
      closeDrawers();
    } catch (error) {
      toast.notify(apiErrorText(error, t, language), 'error');
    }
  }

  function exportSurveys() {
    const exported = exportCsv<GuestSurvey>(filtered, [
      { header: t('fields.guest'), value: (survey) => survey.guestName },
      { header: t('fields.room'), value: (survey) => survey.roomNumber },
      { header: t('fields.checkIn'), value: (survey) => survey.checkInDate ?? '' },
      { header: t('fields.checkOut'), value: (survey) => survey.checkOutDate ?? '' },
      ...RATING_QUESTIONS.map((question) => ({
        header: t(`questions.${question}`),
        value: (survey: GuestSurvey) => survey.ratings[question],
      })),
      { header: t('fields.score'), value: (survey) => surveyScore(survey.ratings) },
      { header: t('drawer.overallTitle'), value: (survey) => survey.overallRating },
      { header: t('fields.hadProblem'), value: (survey) => (survey.hadProblem ? t('yes') : t('no')) },
      { header: t('fields.problemDetails'), value: (survey) => survey.problemDetails },
      { header: t('fields.suggestions'), value: (survey) => survey.suggestions },
      { header: t('fields.status'), value: (survey) => t(`statuses.${survey.status}`) },
    ], `guest-surveys-${new Date().toISOString().slice(0, 10)}.csv`);
    if (exported) toast.notify(pluralText(t, 'toastExported', filtered.length, language), 'success');
    else toast.notify(t('toastNothingToExport'), 'warning');
  }

  const hero = (withActions: boolean) => (
    <PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}>
      {withActions && (
        <>
          <Button variant="glass" onClick={exportSurveys}>
            <FileText aria-hidden="true" />
            {t('export')}
          </Button>
          <Button variant="gold" onClick={() => updateParams({ new: '1', id: null })}>
            <Plus aria-hidden="true" />
            {t('newSurvey')}
          </Button>
        </>
      )}
    </PageHero>
  );

  if (surveysQuery.isPending) {
    return <div className="feature-page guest-surveys">{hero(false)}<LoadingState label={t('loading')} /></div>;
  }

  if (surveysQuery.isError) {
    return (
      <div className="feature-page guest-surveys">
        {hero(false)}
        <ErrorState
          title={t('loadError')}
          message={getErrorMessage(surveysQuery.error, language)}
          action={<Button onClick={() => { void surveysQuery.refetch(); }}>{t('retry')}</Button>}
        />
      </div>
    );
  }

  const average = `${formatScore(stats.average, language)} / ${formatNumber(5, language)}`;

  return (
    <div className="feature-page guest-surveys">
      {hero(true)}

      <div className="stat-grid guest-surveys__stats">
        <StatCard label={t('stats.total')} value={formatNumber(stats.total, language)} icon={<NotebookText size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.average')} value={average} icon={<Check size={20} aria-hidden="true" />} tone="green" />
        <StatCard label={t('stats.complaints')} value={twoDigits(stats.complaints, language)} icon={<Wrench size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.suggestions')} value={twoDigits(stats.suggestions, language)} icon={<Plus size={20} aria-hidden="true" />} tone="green" />
      </div>

      {/* As in the prototype: search, then the "check-out surveys" title and a full-width "new survey" button */}
      <Card className="filters-card guest-surveys__search">
        <SearchBar value={searchDraft} onChange={setSearchDraft} placeholder={t('searchPlaceholder')} />
        <div className="guest-surveys__intro">
          <h2>{t('departureTitle')}</h2>
          <p>{t('departureSubtitle')}</p>
        </div>
        <Button className="guest-surveys__new" onClick={() => updateParams({ new: '1', id: null })}>
          <Plus aria-hidden="true" />
          {t('newSurvey')}
        </Button>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title={query ? t('emptyTitle') : t('emptyNoSurveys')}
          description={query ? t('emptyDescription') : t('emptyNoSurveysHint')}
          action={query
            ? <Button variant="secondary" onClick={() => { setSearchDraft(''); updateParams({ q: null, page: null }); }}>{t('clearSearch')}</Button>
            : <Button onClick={() => updateParams({ new: '1' })}>{t('newSurvey')}</Button>}
        />
      ) : (
        <TableCard
          className="guest-surveys__list"
          title={t('listTitle')}
          subtitle={t('listSubtitle')}
          badge={stats.total > 0 ? t('averageBadge').replace('{level}', t(`levels.${scoreLevel(stats.average)}`)) : undefined}
          footer={totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(next) => updateParams({ page: next > 1 ? String(next) : null })}
              pageLabel={t('pageLabel').replace('{page}', formatNumber(page, language)).replace('{total}', formatNumber(totalPages, language))}
              previousLabel={t('previousPage')}
              nextLabel={t('nextPage')}
              navigationLabel={t('listTitle')}
            />
          ) : undefined}
        >
          <SurveysList surveys={pageSurveys} now={now} onOpen={(id) => updateParams({ id, new: null })} />
        </TableCard>
      )}

      <SurveyDetailsDrawer survey={selected} onClose={closeDrawers} />
      <NewSurveyDrawer
        open={isNewOpen}
        stays={stays}
        isSaving={createSurvey.isPending}
        onClose={closeDrawers}
        onSubmit={addSurvey}
      />
    </div>
  );
}


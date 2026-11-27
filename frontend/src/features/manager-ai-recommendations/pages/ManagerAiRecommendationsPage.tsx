import { useCallback, useMemo } from 'react';
import { Check, Clock, FileText, ReceiptText, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { useToast } from '../../../components/ui/ToastContext';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { exportCsv } from '../../../utils/exportCsv';
import { RecommendationCards } from '../components/RecommendationCards';
import { RecommendationDrawer } from '../components/RecommendationDrawer';
import { CATEGORY_OPTIONS, PRIORITY_RANK, RECOMMENDATIONS_I18N } from '../constants/aiRecommendations.constants';
import { useRecommendations, useRefreshRecommendations, useReviewRecommendation } from '../hooks/useAiRecommendations';
import type { Recommendation, RecommendationCategory, RecommendationReview } from '../types/aiRecommendations.types';
import { apiErrorText } from '../utils/apiErrorText';
import { pluralText, twoDigits } from '../utils/recommendationsDisplay';
import './ManagerAiRecommendationsPage.css';

/** Highest priority first; inside a priority, the ones still waiting for review first */
function byPriority(a: Recommendation, b: Recommendation): number {
  return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
    || Number(a.reviewStatus !== 'NEW') - Number(b.reviewStatus !== 'NEW');
}

// URL params: category (filter chip) and id (details drawer)
export function ManagerAiRecommendationsPage() {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${RECOMMENDATIONS_I18N}.${key}`), [translate]);
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') ?? '';
  const category = (CATEGORY_OPTIONS as string[]).includes(categoryParam) ? categoryParam as RecommendationCategory : '';

  const listQuery = useRecommendations(language);
  const refresh = useRefreshRecommendations(language);
  const review = useReviewRecommendation(language);
  const items = useMemo(() => [...(listQuery.data?.items ?? [])].sort(byPriority), [listQuery.data]);
  const visible = useMemo(() => (category ? items.filter((item) => item.category === category) : items), [items, category]);
  const selected = items.find((item) => item.id === searchParams.get('id')) ?? null;

  const updateParams = useCallback((changes: Record<string, string | null>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [name, value] of Object.entries(changes)) {
        if (value === null || value === '') next.delete(name);
        else next.set(name, value);
      }
      return next;
    });
  }, [setSearchParams]);

  // The cards count every recommendation, not only the filtered ones
  const stats = useMemo(() => ({
    total: items.length,
    high: items.filter((item) => item.priority === 'HIGH').length,
    medium: items.filter((item) => item.priority === 'MEDIUM').length,
    low: items.filter((item) => item.priority === 'LOW').length,
  }), [items]);

  async function refreshAll() {
    try {
      const result = await refresh.mutateAsync();
      toast.notify(pluralText(t, 'toastRefreshed', result.items.length, language), 'success');
    } catch (error) {
      toast.notify(apiErrorText(error, t, language), 'error');
    }
  }

  async function saveReview(body: RecommendationReview) {
    if (!selected) return;
    try {
      await review.mutateAsync({ id: selected.id, body });
      toast.notify(t(body.review_status === 'REVIEWED' ? 'toastReviewed' : 'toastLater'), 'success');
      updateParams({ id: null });
    } catch (error) {
      toast.notify(apiErrorText(error, t, language), 'error');
    }
  }

  function exportItems() {
    const exported = exportCsv<Recommendation>(visible, [
      { header: t('fields.priority'), value: (item) => t(`priorities.${item.priority}`) },
      { header: t('fields.category'), value: (item) => t(`categories.${item.category}`) },
      { header: t('fields.title'), value: (item) => item.title },
      { header: t('fields.summary'), value: (item) => item.summary },
      { header: t('fields.reasonFull'), value: (item) => item.reason },
      { header: t('fields.supportingStats'), value: (item) => item.supportingStats.join(' | ') },
      { header: t('fields.suggestedActions'), value: (item) => item.suggestedActions.join(' | ') },
      { header: t('fields.expectedResult'), value: (item) => item.expectedBenefit },
      { header: t('fields.reviewStatus'), value: (item) => t(`reviewStatuses.${item.reviewStatus}`) },
      { header: t('fields.managerNotes'), value: (item) => item.managerNotes },
    ], `ai-recommendations-${new Date().toISOString().slice(0, 10)}.csv`);
    if (exported) toast.notify(pluralText(t, 'toastExported', visible.length, language), 'success');
    else toast.notify(t('toastNothingToExport'), 'warning');
  }

  const hero = (withActions: boolean) => (
    <PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}>
      {withActions && (
        <>
          <Button variant="glass" onClick={exportItems}>
            <FileText aria-hidden="true" />
            {t('export')}
          </Button>
          <Button variant="gold" onClick={() => { void refreshAll(); }} disabled={refresh.isPending}>
            <Check aria-hidden="true" />
            {refresh.isPending ? t('refreshing') : t('refresh')}
          </Button>
        </>
      )}
    </PageHero>
  );

  if (listQuery.isPending) {
    return <div className="feature-page manager-ai-recs">{hero(false)}<LoadingState label={t('loading')} /></div>;
  }

  if (listQuery.isError) {
    return (
      <div className="feature-page manager-ai-recs">
        {hero(false)}
        <ErrorState
          title={t('loadError')}
          message={getErrorMessage(listQuery.error, language)}
          action={<Button onClick={() => { void listQuery.refetch(); }}>{t('retry')}</Button>}
        />
      </div>
    );
  }

  return (
    <div className="feature-page manager-ai-recs">
      {hero(true)}

      <div className="stat-grid manager-ai-recs__stats">
        <StatCard label={t('stats.total')} value={twoDigits(stats.total, language)} icon={<ReceiptText size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.high')} value={twoDigits(stats.high, language)} icon={<Wrench size={20} aria-hidden="true" />} tone="gold" />
        <StatCard label={t('stats.medium')} value={twoDigits(stats.medium, language)} icon={<Clock size={20} aria-hidden="true" />} tone="green" />
        <StatCard label={t('stats.low')} value={twoDigits(stats.low, language)} icon={<Check size={20} aria-hidden="true" />} tone="green" />
      </div>

      <Card className="manager-ai-recs__filters">
        <div className="manager-ai-recs__filters-copy">
          <h2>{t('listTitle')}</h2>
          <p>{t('listSubtitle')}</p>
        </div>
        <div className="manager-ai-recs__chips" role="group" aria-label={t('filterLabel')}>
          {(['', ...CATEGORY_OPTIONS] as const).map((option) => (
            <button
              key={option || 'all'}
              type="button"
              className={`manager-ai-recs__chip${category === option ? ' manager-ai-recs__chip--active' : ''}`}
              aria-pressed={category === option}
              onClick={() => updateParams({ category: option || null, id: null })}
            >
              {option ? t(`categories.${option}`) : t('all')}
            </button>
          ))}
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          title={category ? t('emptyCategory') : t('emptyAll')}
          description={category ? t('emptyCategoryHint') : t('emptyAllHint')}
          action={category
            ? <Button variant="secondary" onClick={() => updateParams({ category: null })}>{t('all')}</Button>
            : <Button onClick={() => { void refreshAll(); }} disabled={refresh.isPending}>{t('refresh')}</Button>}
        />
      ) : (
        <RecommendationCards items={visible} onOpen={(id) => updateParams({ id })} />
      )}

      <RecommendationDrawer
        recommendation={selected}
        isSaving={review.isPending}
        onClose={() => updateParams({ id: null })}
        onReview={(body) => { void saveReview(body); }}
      />
    </div>
  );
}

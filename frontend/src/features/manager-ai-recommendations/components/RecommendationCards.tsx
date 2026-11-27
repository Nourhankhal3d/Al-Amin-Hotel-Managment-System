import { useCallback } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { PRIORITY_TONE, RECOMMENDATIONS_I18N, REVIEW_TONE } from '../constants/aiRecommendations.constants';
import type { Recommendation, RecommendationPriority } from '../types/aiRecommendations.types';
import './RecommendationCards.css';

export function PriorityBadge({ priority, label }: { priority: RecommendationPriority; label: string }) {
  return (
    <Badge tone={PRIORITY_TONE[priority]} className="ai-priority-badge">
      <span className="ai-priority-badge__dot" aria-hidden="true" />
      {label}
    </Badge>
  );
}

interface RecommendationCardsProps {
  items: Recommendation[];
  onOpen: (id: string) => void;
}

// Two cards per row: priority and category, title, summary, reason box, expected benefit, "view details"
export function RecommendationCards({ items, onOpen }: RecommendationCardsProps) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${RECOMMENDATIONS_I18N}.${key}`), [translate]);
  const MoreIcon = language === 'ar' ? ChevronRight : ChevronLeft;

  return (
    <ul className="ai-rec-cards">
      {items.map((item) => (
        <li key={item.id} className={`ai-rec-card${item.reviewStatus === 'REVIEWED' ? ' ai-rec-card--reviewed' : ''}`}>
          <div className="ai-rec-card__top">
            <span className="ai-rec-card__badges">
              <PriorityBadge priority={item.priority} label={t(`priorities.${item.priority}`)} />
              {item.reviewStatus !== 'NEW' && (
                <Badge tone={REVIEW_TONE[item.reviewStatus]}>{t(`reviewStatuses.${item.reviewStatus}`)}</Badge>
              )}
            </span>
            <span className="ai-rec-card__category">{t(`categories.${item.category}`)}</span>
          </div>

          <h3 className="ai-rec-card__title">{item.title}</h3>
          <p className="ai-rec-card__summary">{item.summary}</p>

          <div className="ai-rec-card__reason">
            <strong>{t('fields.reason')}</strong>
            <span>{item.reason}</span>
          </div>

          <div className="ai-rec-card__benefit">
            <span>
              <strong>{t('fields.expectedBenefit')}</strong>
              <span>{item.expectedBenefit}</span>
            </span>
            <Check aria-hidden="true" />
          </div>

          <button
            type="button"
            className="ai-rec-card__more"
            aria-label={t('openRecommendation').replace('{title}', item.title)}
            onClick={() => onOpen(item.id)}
          >
            {t('viewDetails')}
            <MoreIcon aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

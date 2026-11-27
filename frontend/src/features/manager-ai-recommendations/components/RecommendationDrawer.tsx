import { useCallback, useState } from 'react';
import { Check, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import { NOTES_MAX_LENGTH, RECOMMENDATIONS_I18N } from '../constants/aiRecommendations.constants';
import type { Recommendation, RecommendationReview } from '../types/aiRecommendations.types';
import { PriorityBadge } from './RecommendationCards';
import './RecommendationDrawer.css';

interface RecommendationDrawerProps {
  recommendation: Recommendation | null;
  isSaving: boolean;
  onClose: () => void;
  onReview: (body: RecommendationReview) => void;
}

export function RecommendationDrawer({ recommendation, ...props }: RecommendationDrawerProps) {
  if (!recommendation) return null;
  // key: fresh notes for every recommendation that is opened
  return <RecommendationDetails key={recommendation.id} recommendation={recommendation} {...props} />;
}

function RecommendationDetails({ recommendation: item, isSaving, onClose, onReview }: RecommendationDrawerProps & { recommendation: Recommendation }) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${RECOMMENDATIONS_I18N}.${key}`), [translate]);
  const [notes, setNotes] = useState(item.managerNotes);
  const tooLong = notes.trim().length > NOTES_MAX_LENGTH;

  function review(status: RecommendationReview['review_status']) {
    if (tooLong) return;
    onReview({ review_status: status, ...(notes.trim() ? { manager_notes: notes.trim() } : {}) });
  }

  return (
    <Drawer
      open
      eyebrow={t('drawerEyebrow')}
      title={t(`categories.${item.category}`)}
      closeLabel={t('close')}
      onClose={onClose}
      className="ai-rec-drawer"
      footer={(
        <div className="drawer-details__footer">
          <Button variant="secondary" onClick={() => review('LATER')} disabled={isSaving}>{t('later')}</Button>
          <Button onClick={() => review('REVIEWED')} disabled={isSaving}>{isSaving ? t('saving') : t('markReviewed')}</Button>
        </div>
      )}
    >
      <div className="drawer-details ai-rec-details">
        <div className="drawer-details__summary ai-rec-details__head">
          <PriorityBadge priority={item.priority} label={t(`priorities.${item.priority}`)} />
          <strong>{item.title}</strong>
        </div>

        <section>
          <h3 className="drawer-details__heading">{t('fields.summary')}</h3>
          <p className="drawer-details__box">{item.summary}</p>
        </section>

        <section>
          <h3 className="drawer-details__heading">{t('fields.reasonFull')}</h3>
          <p className="drawer-details__box">{item.reason}</p>
        </section>

        {item.supportingStats.length > 0 && (
          <section className="ai-rec-details__card">
            <h3 className="drawer-details__heading">{t('fields.supportingStats')}</h3>
            <ul className="ai-rec-details__stats">
              {item.supportingStats.map((stat) => (
                <li key={stat}>
                  <FileText aria-hidden="true" />
                  <span>{stat}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {item.suggestedActions.length > 0 && (
          <section>
            <h3 className="drawer-details__heading">{t('fields.suggestedActions')}</h3>
            <ul className="drawer-details__box ai-rec-details__actions">
              {item.suggestedActions.map((action) => <li key={action}>{action}</li>)}
            </ul>
          </section>
        )}

        <div className="ai-rec-details__result">
          <span>
            <small>{t('fields.expectedResult')}</small>
            <strong>{item.expectedBenefit}</strong>
          </span>
          <Check aria-hidden="true" />
        </div>

        <section className="ai-rec-details__field">
          <label className="ai-rec-details__label" htmlFor="ai-rec-notes">{t('fields.managerNotes')}</label>
          <textarea
            id="ai-rec-notes"
            className={`drawer-details__textarea${tooLong ? ' ai-rec-details__control--error' : ''}`}
            value={notes}
            maxLength={NOTES_MAX_LENGTH}
            placeholder={t('notesPlaceholder')}
            disabled={isSaving}
            onChange={(event) => setNotes(event.target.value)}
          />
          {tooLong && (
            <span className="ai-rec-details__error">{t('errors.notesTooLong').replace('{max}', formatNumber(NOTES_MAX_LENGTH, language))}</span>
          )}
        </section>
      </div>
    </Drawer>
  );
}

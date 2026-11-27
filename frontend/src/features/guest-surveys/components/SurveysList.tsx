import { useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, UserRound } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { STATUS_TONE, SURVEYS_I18N } from '../constants/guestSurveys.constants';
import type { GuestSurvey } from '../types/guestSurveys.types';
import { departureText, formatRoom, formatScore, surveyScore } from '../utils/surveyDisplay';
import './SurveysList.css';

interface SurveysListProps {
  surveys: GuestSurvey[];
  now: number;
  onOpen: (id: string) => void;
}

// One row per survey: guest, room and departure, score, status; the row opens the survey
export function SurveysList({ surveys, now, onOpen }: SurveysListProps) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${SURVEYS_I18N}.${key}`), [translate]);
  // The arrow points to the side the drawer opens from
  const OpenIcon = language === 'ar' ? ChevronRight : ChevronLeft;

  return (
    <ul className="surveys-list">
      {surveys.map((survey) => {
        const score = formatScore(surveyScore(survey.ratings), language);
        return (
          <li key={survey.id}>
            <button
              type="button"
              className="surveys-list__row"
              aria-label={t('openSurvey').replace('{guest}', survey.guestName).replace('{room}', formatRoom(survey.roomNumber, language))}
              onClick={() => onOpen(survey.id)}
            >
              <span className="surveys-list__avatar" aria-hidden="true"><UserRound /></span>
              <span className="surveys-list__text">
                <strong>{survey.guestName}</strong>
                <span>
                  {t('roomLabel').replace('{room}', formatRoom(survey.roomNumber, language))}
                  {' · '}
                  {departureText(t, survey.checkOutDate, language, now)}
                </span>
              </span>
              <span className="surveys-list__score">
                <Star aria-hidden="true" fill="currentColor" />
                <span className="surveys-list__score-value">{score}</span>
              </span>
              <Badge tone={STATUS_TONE[survey.status]}>{t(`statuses.${survey.status}`)}</Badge>
              <OpenIcon className="surveys-list__chevron" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

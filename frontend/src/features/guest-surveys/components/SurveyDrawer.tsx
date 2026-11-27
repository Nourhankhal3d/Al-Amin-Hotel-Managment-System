import { useCallback, useId, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Combobox } from '../../../components/ui/Combobox';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import { STATUS_OPTIONS, STATUS_TONE, SURVEYS_I18N, TEXT_MAX_LENGTH } from '../constants/guestSurveys.constants';
import {
  EMPTY_NEW_SURVEY,
  NEW_SURVEY_FIELD_ORDER,
  findStay,
  validateNewSurvey,
  type NewSurveyErrors,
  type NewSurveyField,
  type NewSurveyValues,
} from '../schemas/newSurvey.schema';
import { RATING_QUESTIONS, type DepartingStay, type GuestSurvey, type RatingQuestion } from '../types/guestSurveys.types';
import { formatDay, formatRoom, roomTypeText } from '../utils/surveyDisplay';
import { StarRating } from './StarRating';
import './SurveyDrawer.css';

const FORM_ID = 'guest-survey-form';

interface NewSurveyDrawerProps {
  open: boolean;
  stays: DepartingStay[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: NewSurveyValues, stay: DepartingStay) => void;
}

/** "New survey": mounted only while open, so the form always starts empty */
export function NewSurveyDrawer({ open, ...props }: NewSurveyDrawerProps) {
  if (!open) return null;
  return <NewSurveyForm {...props} />;
}

interface SurveyDetailsDrawerProps {
  survey: GuestSurvey | null;
  onClose: () => void;
}

/** A saved survey, read only, in the same layout as the form */
export function SurveyDetailsDrawer({ survey, onClose }: SurveyDetailsDrawerProps) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${SURVEYS_I18N}.${key}`), [translate]);
  const baseId = useId();
  if (!survey) return null;

  return (
    <Drawer
      open
      eyebrow={t('drawer.eyebrow')}
      title={t('drawer.viewTitle')}
      closeLabel={t('close')}
      onClose={onClose}
      className="survey-drawer"
      footer={(
        <div className="survey-form__footer survey-form__footer--single">
          <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
        </div>
      )}
    >
      <div className="survey-form">
        <GuestSection
          t={t}
          guestName={survey.guestName}
          roomType={survey.roomType}
          checkIn={survey.checkInDate}
          checkOut={survey.checkOutDate}
          room={(
            <div className="survey-form__tile">
              <span>{t('fields.room')}</span>
              <strong>{formatRoom(survey.roomNumber, language)}</strong>
            </div>
          )}
        />

        <section className="survey-form__card">
          <h3 className="survey-form__card-title">{t('drawer.ratingsTitle')}</h3>
          <ul className="survey-form__questions">
            {RATING_QUESTIONS.map((question) => (
              <li key={question} className="survey-form__question">
                <span id={`${baseId}-${question}`}>{t(`questions.${question}`)}</span>
                <StarRating
                  name={`${baseId}-${question}`}
                  labelledBy={`${baseId}-${question}`}
                  value={survey.ratings[question]}
                  starLabel={t('starLabel')}
                  readOnly
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="survey-form__card">
          <div className="survey-form__tile">
            <span>{t('fields.hadProblem')}</span>
            <strong>{survey.hadProblem ? t('yes') : t('no')}</strong>
          </div>
          {survey.hadProblem && (
            <div className="survey-form__tile">
              <span>{t('fields.problemDetails')}</span>
              <p>{survey.problemDetails || '—'}</p>
            </div>
          )}
          <div className="survey-form__tile">
            <span>{t('fields.suggestions')}</span>
            <p>{survey.suggestions || '—'}</p>
          </div>
        </section>

        <section className="survey-form__overall">
          <div>
            <h3 id={`${baseId}-overall`}>{t('drawer.overallTitle')}</h3>
            <p>{t('drawer.overallHint')}</p>
          </div>
          <StarRating
            name={`${baseId}-overall`}
            labelledBy={`${baseId}-overall`}
            value={survey.overallRating}
            starLabel={t('starLabel')}
            readOnly
            size="lg"
          />
        </section>

        <div className="survey-form__tile survey-form__tile--row">
          <span>{t('fields.status')}</span>
          <Badge tone={STATUS_TONE[survey.status]}>{t(`statuses.${survey.status}`)}</Badge>
        </div>
      </div>
    </Drawer>
  );
}

interface GuestSectionProps {
  t: (key: string) => string;
  guestName: string | null;
  roomType: string | null;
  checkIn: string | null;
  checkOut: string | null;
  room: ReactNode;
}

function GuestSection({ t, guestName, roomType, checkIn, checkOut, room }: GuestSectionProps) {
  const { language } = useLanguage();
  return (
    <section className="survey-form__card">
      <h3 className="survey-form__card-title survey-form__card-title--green">
        <UserRound aria-hidden="true" />
        {t('drawer.guestTitle')}
      </h3>
      <div className="survey-form__grid">
        <div className="survey-form__tile">
          <span>{t('fields.guest')}</span>
          <strong>{guestName || '—'}</strong>
        </div>
        {room}
        <div className="survey-form__tile">
          <span>{t('fields.roomType')}</span>
          <strong>{roomTypeText(t, roomType)}</strong>
        </div>
        <div className="survey-form__tile">
          <span>{t('fields.checkIn')}</span>
          <strong>{formatDay(checkIn, language)}</strong>
        </div>
        <div className="survey-form__tile survey-form__tile--wide">
          <span>{t('fields.checkOut')}</span>
          <strong>{formatDay(checkOut, language)}</strong>
        </div>
      </div>
    </section>
  );
}

function NewSurveyForm({ stays, isSaving, onClose, onSubmit }: Omit<NewSurveyDrawerProps, 'open'>) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${SURVEYS_I18N}.${key}`), [translate]);
  const baseId = useId();
  const fieldId = (field: NewSurveyField) => `${baseId}-${field}`;
  const [values, setValues] = useState<NewSurveyValues>(EMPTY_NEW_SURVEY);
  const [errors, setErrors] = useState<NewSurveyErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const stay = useMemo(() => findStay(values.roomNumber, stays), [values.roomNumber, stays]);

  // Errors appear after the first submit, then update live while the user fixes them
  function update(next: NewSurveyValues) {
    setValues(next);
    if (submitted) setErrors(validateNewSurvey(next, stays));
  }

  function setField<F extends keyof NewSurveyValues>(field: F, value: NewSurveyValues[F]) {
    update({ ...values, [field]: value });
  }

  function setRating(question: RatingQuestion, value: number) {
    update({ ...values, ratings: { ...values.ratings, [question]: value } });
  }

  const errorText = (field: NewSurveyField) => {
    const key = errors[field];
    return key ? t(`errors.${key}`).replace('{max}', formatNumber(TEXT_MAX_LENGTH, language)) : undefined;
  };

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setSubmitted(true);
    const found = validateNewSurvey(values, stays);
    setErrors(found);
    const firstInvalid = NEW_SURVEY_FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      // Take the user to the first field that needs fixing
      const target = document.getElementById(fieldId(firstInvalid));
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      (target?.querySelector('input') ?? target)?.focus();
      return;
    }
    if (stay) onSubmit(values, stay);
  }

  const ratingsError = errorText('ratings');
  const overallError = errorText('overallRating');
  const problemError = errorText('problemDetails');
  const suggestionsError = errorText('suggestions');

  return (
    <Drawer
      open
      eyebrow={t('drawer.eyebrow')}
      title={t('drawer.newTitle')}
      closeLabel={t('close')}
      onClose={onClose}
      className="survey-drawer"
      footer={(
        <div className="survey-form__footer">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>{t('cancel')}</Button>
          <Button type="submit" form={FORM_ID} disabled={isSaving}>{isSaving ? t('saving') : t('save')}</Button>
        </div>
      )}
    >
      <form id={FORM_ID} className="survey-form" onSubmit={handleSubmit} noValidate>
        <GuestSection
          t={t}
          guestName={stay?.guestName ?? null}
          roomType={stay?.roomType ?? null}
          checkIn={stay?.checkInDate ?? null}
          checkOut={stay?.checkOutDate ?? null}
          room={(
            <Combobox
              id={fieldId('roomNumber')}
              label={t('fields.room')}
              value={values.roomNumber}
              options={stays.map((item) => ({ value: item.roomNumber, label: formatRoom(item.roomNumber, language) }))}
              inputMode="numeric"
              placeholder={t('drawer.roomPlaceholder')}
              noResultsLabel={t('drawer.roomNoResults')}
              onChange={(next) => setField('roomNumber', next)}
              error={errorText('roomNumber')}
              disabled={isSaving}
            />
          )}
        />

        <section className="survey-form__card" id={fieldId('ratings')} tabIndex={-1}>
          <h3 className="survey-form__card-title">{t('drawer.ratingsTitle')}</h3>
          <ul className="survey-form__questions">
            {RATING_QUESTIONS.map((question) => (
              <li key={question} className="survey-form__question">
                <span id={`${baseId}-q-${question}`}>{t(`questions.${question}`)}</span>
                <StarRating
                  name={`${baseId}-q-${question}`}
                  labelledBy={`${baseId}-q-${question}`}
                  value={values.ratings[question]}
                  starLabel={t('starLabel')}
                  onChange={(value) => setRating(question, value)}
                  readOnly={isSaving}
                  invalid={Boolean(ratingsError) && values.ratings[question] < 1}
                />
              </li>
            ))}
          </ul>
          {ratingsError && <span className="survey-form__error" role="alert">{ratingsError}</span>}
        </section>

        <section className="survey-form__card">
          <Select
            id={`${baseId}-had-problem`}
            label={t('fields.hadProblem')}
            value={values.hadProblem}
            options={[{ value: 'no', label: t('no') }, { value: 'yes', label: t('yes') }]}
            onChange={(next) => setField('hadProblem', next === 'yes' ? 'yes' : 'no')}
            disabled={isSaving}
          />
          {values.hadProblem === 'yes' && (
            <label className="survey-form__field">
              <span>{t('fields.problemDetails')}</span>
              <textarea
                id={fieldId('problemDetails')}
                rows={3}
                placeholder={t('drawer.problemPlaceholder')}
                value={values.problemDetails}
                maxLength={TEXT_MAX_LENGTH}
                disabled={isSaving}
                aria-invalid={problemError ? true : undefined}
                className={problemError ? 'survey-form__control--error' : undefined}
                onChange={(event) => setField('problemDetails', event.target.value)}
              />
              {problemError && <span className="survey-form__error">{problemError}</span>}
            </label>
          )}
          <label className="survey-form__field">
            <span>{t('fields.suggestions')}</span>
            <textarea
              id={fieldId('suggestions')}
              rows={3}
              placeholder={t('drawer.suggestionsPlaceholder')}
              value={values.suggestions}
              maxLength={TEXT_MAX_LENGTH}
              disabled={isSaving}
              aria-invalid={suggestionsError ? true : undefined}
              className={suggestionsError ? 'survey-form__control--error' : undefined}
              onChange={(event) => setField('suggestions', event.target.value)}
            />
            {suggestionsError && <span className="survey-form__error">{suggestionsError}</span>}
          </label>
        </section>

        <section className={`survey-form__overall${overallError ? ' survey-form__overall--error' : ''}`} id={fieldId('overallRating')} tabIndex={-1}>
          <div>
            <h3 id={`${baseId}-overall`}>{t('drawer.overallTitle')}</h3>
            <p>{overallError ?? t('drawer.overallHint')}</p>
          </div>
          <StarRating
            name={`${baseId}-overall`}
            labelledBy={`${baseId}-overall`}
            value={values.overallRating}
            starLabel={t('starLabel')}
            onChange={(value) => setField('overallRating', value)}
            readOnly={isSaving}
            invalid={Boolean(overallError)}
            size="lg"
          />
        </section>

        <Select
          id={`${baseId}-status`}
          label={t('fields.status')}
          value={values.status}
          options={STATUS_OPTIONS.map((status) => ({ value: status, label: t(`statuses.${status}`) }))}
          onChange={(next) => setField('status', next === 'PENDING_REVIEW' ? 'PENDING_REVIEW' : 'COMPLETED')}
          disabled={isSaving}
        />
      </form>
    </Drawer>
  );
}

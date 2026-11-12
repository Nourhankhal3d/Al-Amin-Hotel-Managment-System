import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Clock3, Download, Settings } from 'lucide-react';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { Button } from '../../../components/ui/Button';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { Switch } from '../../../components/ui/Switch';
import { useToast } from '../../../components/ui/ToastContext';
import { useLanguage } from '../../../core/i18n/useLanguage';
import type { Language } from '../../../core/i18n';
import { useTheme } from '../../../core/theme/useTheme';
import type { ThemeMode } from '../../../core/theme/themeContextInstance';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import {
  getSubManagerSettings,
  updateSubManagerSettings,
} from '../services/submanager-settings.api';
import type {
  ShiftConfiguration,
  SubManagerHotelSettings,
  SubManagerSettings,
} from '../types/submanager-settings.types';
import './SubManagerSettingsPage.css';

const SHIFT_CONFIGURATIONS: ShiftConfiguration[] = [
  { id: 'morning', name: 'morning', startTime: '07:00', endTime: '16:00' },
  { id: 'evening', name: 'evening', startTime: '16:00', endTime: '23:00' },
  { id: 'night', name: 'night', startTime: '23:00', endTime: '07:00' },
];

function getValidationErrors(hotel: SubManagerHotelSettings): Partial<Record<keyof SubManagerHotelSettings, string>> {
  const errors: Partial<Record<keyof SubManagerHotelSettings, string>> = {};
  if (!hotel.hotelName.trim()) errors.hotelName = 'hotelName';
  if (!hotel.location.trim()) errors.location = 'location';
  if (!Number.isInteger(hotel.floorsCount) || hotel.floorsCount < 1) errors.floorsCount = 'positiveInteger';
  if (!Number.isInteger(hotel.totalRooms) || hotel.totalRooms < 1) errors.totalRooms = 'positiveInteger';
  return errors;
}

function escapeCsvValue(value: string | number): string {
  const safeValue = String(value).replace(/^[=+\-@]/, (prefix) => `'${prefix}`);
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export function SubManagerSettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState<SubManagerSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<SubManagerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const preferencesRef = useRef({ language, themeMode });
  preferencesRef.current = { language, themeMode };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getSubManagerSettings();
      const loadedSettings = {
        ...data,
        appearance: preferencesRef.current.themeMode,
        language: preferencesRef.current.language,
      };
      setSettings(loadedSettings);
      setSavedSettings(loadedSettings);
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const hasChanges = useMemo(
    () => Boolean(settings && savedSettings && JSON.stringify(settings) !== JSON.stringify(savedSettings)),
    [settings, savedSettings],
  );
  const validationErrors = settings ? getValidationErrors(settings.hotel) : {};
  const showSavedBadge = hasSaved && !hasChanges;

  useEffect(() => {
    if (!hasChanges) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = t('submanager.settings.unsavedWarning');
      return event.returnValue;
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [hasChanges, t]);

  useEffect(() => {
    if (loading) return;
    if (searchParams.get('section') !== 'notifications') return;
    document.getElementById('submanager-settings-notifications')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [loading, searchParams]);

  function updateHotelField<K extends keyof SubManagerHotelSettings>(
    key: K,
    value: SubManagerHotelSettings[K],
  ) {
    setSettings((current) =>
      current ? { ...current, hotel: { ...current.hotel, [key]: value } } : current,
    );
    setHasSaved(false);
  }

  function handleNumberChange(
    key: 'floorsCount' | 'totalRooms',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    updateHotelField(key, event.target.value === '' ? 0 : Number(event.target.value));
  }

  async function handleSave() {
    if (!settings || saving || !hasChanges) return;
    setValidationAttempted(true);
    if (Object.keys(getValidationErrors(settings.hotel)).length > 0) return;

    setSaving(true);
    try {
      const saved = await updateSubManagerSettings(settings);
      setSettings(saved);
      setSavedSettings(saved);
      setHasSaved(true);
      showToast(t('submanager.settings.saveSuccess'), 'success');
    } catch (error) {
      showToast(`${t('submanager.settings.saveError')}: ${getErrorMessage(error, language)}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    if (!settings) return;
    const rows: Array<[string, string | number]> = [
      [t('submanager.settings.hotel.name'), settings.hotel.hotelName],
      [t('submanager.settings.hotel.location'), settings.hotel.location],
      [t('submanager.settings.hotel.floors'), settings.hotel.floorsCount],
      [t('submanager.settings.hotel.rooms'), settings.hotel.totalRooms],
      ...SHIFT_CONFIGURATIONS.map<[string, string]>((shift) => [
        t(`submanager.settings.shifts.${shift.name}`),
        `${shift.startTime} - ${shift.endTime}`,
      ]),
      [
        t('submanager.settings.notifications.payments'),
        t(settings.notifications.payments ? 'submanager.settings.enabled' : 'submanager.settings.disabled'),
      ],
      [
        t('submanager.settings.notifications.reports'),
        t(settings.notifications.reports ? 'submanager.settings.enabled' : 'submanager.settings.disabled'),
      ],
      [t('submanager.settings.appearance.label'), t(`submanager.settings.appearance.${settings.appearance}`)],
      [t('submanager.settings.language.label'), t(`submanager.settings.language.${settings.language}`)],
    ];
    const csv = [
      `${escapeCsvValue(t('submanager.settings.export.field'))},${escapeCsvValue(t('submanager.settings.export.value'))}`,
      ...rows.map(([label, value]) => `${escapeCsvValue(label)},${escapeCsvValue(value)}`),
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'al-amin-submanager-settings.csv';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast(t('submanager.settings.exportSuccess'), 'success');
  }

  if (loading) {
    return <LoadingState label={t('submanager.settings.loading')} />;
  }

  if (loadError || !settings) {
    return (
      <div className="submanager-settings-page">
        <ErrorState
          title={t('submanager.settings.loadError')}
          message={getErrorMessage(loadError, language)}
          action={<Button onClick={() => void loadSettings()}>{t('submanager.settings.retry')}</Button>}
        />
      </div>
    );
  }

  const fieldError = (key: keyof SubManagerHotelSettings) => {
    const error = validationAttempted ? validationErrors[key] : undefined;
    return error ? t(`submanager.settings.validation.${error}`) : undefined;
  };
  const appearanceOptions = [
    { value: 'light', label: t('submanager.settings.appearance.light') },
    { value: 'dark', label: t('submanager.settings.appearance.dark') },
    { value: 'system', label: t('submanager.settings.appearance.system') },
  ];
  const languageOptions = [
    { value: 'ar', label: t('submanager.settings.language.arabic') },
    { value: 'en', label: t('submanager.settings.language.english') },
  ];

  return (
    <div className="submanager-settings-page">
      <PageHero
        className="submanager-settings-page__hero"
        eyebrow={t('submanager.settings.eyebrow')}
        title={t('submanager.settings.title')}
        description={t('submanager.settings.subtitle')}
      >
        <Button
          variant="gold"
          onClick={() => void handleSave()}
          disabled={!hasChanges || saving}
        >
          <Check aria-hidden="true" />
          حفظ التغييرات
        </Button>
        <Button variant="glass" onClick={handleExport}>
          <Download aria-hidden="true" />
          تصدير
        </Button>
      </PageHero>

      <section className="submanager-settings-card" aria-labelledby="submanager-settings-hotel-title">
        <header className="submanager-settings-card__header">
          <div>
            <h2 id="submanager-settings-hotel-title">{t('submanager.settings.hotel.title')}</h2>
            <p>{t('submanager.settings.hotel.subtitle')}</p>
          </div>
          {showSavedBadge && (
            <span className="submanager-settings-page__saved-badge">
              <Check aria-hidden="true" />
              {t('submanager.settings.saved')}
            </span>
          )}
        </header>
        <div className="submanager-settings-page__hotel-grid">
          <label className="submanager-settings-page__field">
            <span>{t('submanager.settings.hotel.name')}</span>
            <input
              value={settings.hotel.hotelName}
              onChange={(event) => updateHotelField('hotelName', event.target.value)}
              aria-invalid={Boolean(fieldError('hotelName'))}
              aria-describedby={fieldError('hotelName') ? 'submanager-settings-hotelName-error' : undefined}
              required
            />
            {fieldError('hotelName') && <small id="submanager-settings-hotelName-error">{fieldError('hotelName')}</small>}
          </label>
          <label className="submanager-settings-page__field">
            <span>{t('submanager.settings.hotel.location')}</span>
            <input
              value={settings.hotel.location}
              onChange={(event) => updateHotelField('location', event.target.value)}
              aria-invalid={Boolean(fieldError('location'))}
              aria-describedby={fieldError('location') ? 'submanager-settings-location-error' : undefined}
              required
            />
            {fieldError('location') && <small id="submanager-settings-location-error">{fieldError('location')}</small>}
          </label>
          <label className="submanager-settings-page__field">
            <span>{t('submanager.settings.hotel.floors')}</span>
            <input
              type="number"
              min={1}
              step={1}
              value={settings.hotel.floorsCount}
              onChange={(event) => handleNumberChange('floorsCount', event)}
              aria-invalid={Boolean(fieldError('floorsCount'))}
              aria-describedby={fieldError('floorsCount') ? 'submanager-settings-floorsCount-error' : undefined}
              required
            />
            {fieldError('floorsCount') && <small id="submanager-settings-floorsCount-error">{fieldError('floorsCount')}</small>}
          </label>
          <label className="submanager-settings-page__field">
            <span>{t('submanager.settings.hotel.rooms')}</span>
            <input
              type="number"
              min={1}
              step={1}
              value={settings.hotel.totalRooms}
              onChange={(event) => handleNumberChange('totalRooms', event)}
              aria-invalid={Boolean(fieldError('totalRooms'))}
              aria-describedby={fieldError('totalRooms') ? 'submanager-settings-totalRooms-error' : undefined}
              required
            />
            {fieldError('totalRooms') && <small id="submanager-settings-totalRooms-error">{fieldError('totalRooms')}</small>}
          </label>
        </div>
      </section>

      <section className="submanager-settings-card" aria-labelledby="submanager-settings-shifts-title">
        <header className="submanager-settings-card__header">
          <div>
            <h2 id="submanager-settings-shifts-title">{t('submanager.settings.shifts.title')}</h2>
            <p>{t('submanager.settings.shifts.subtitle')}</p>
          </div>
        </header>
        <div className="submanager-settings-page__shift-list">
          {SHIFT_CONFIGURATIONS.map((shift) => (
            <article key={shift.id} className="submanager-settings-page__shift">
              <div className="submanager-settings-page__shift-info">
                <h3>
                  <Settings aria-hidden="true" />
                  {t(`submanager.settings.shifts.${shift.name}`)}
                </h3>
                <p>{shift.startTime} - {shift.endTime}</p>
              </div>
              <span className="submanager-settings-page__shift-icon"><Clock3 aria-hidden="true" /></span>
            </article>
          ))}
        </div>
      </section>

      <section
        id="submanager-settings-notifications"
        className="submanager-settings-card"
        aria-labelledby="submanager-settings-notifications-title"
      >
        <header className="submanager-settings-card__header">
          <div>
            <h2 id="submanager-settings-notifications-title">{t('submanager.settings.notifications.title')}</h2>
            <p>{t('submanager.settings.notifications.subtitle')}</p>
          </div>
        </header>
        <div className="submanager-settings-page__notification-grid">
          <div className="submanager-settings-page__notification">
            <Switch
              checked={settings.notifications.payments}
              onChange={(checked) => {
                setSettings((current) => current ? {
                  ...current,
                  notifications: { ...current.notifications, payments: checked },
                } : current);
                setHasSaved(false);
              }}
              label={t('submanager.settings.notifications.payments')}
              description={t('submanager.settings.notifications.paymentsDescription')}
            />
          </div>
          <div className="submanager-settings-page__notification">
            <Switch
              checked={settings.notifications.reports}
              onChange={(checked) => {
                setSettings((current) => current ? {
                  ...current,
                  notifications: { ...current.notifications, reports: checked },
                } : current);
                setHasSaved(false);
              }}
              label={t('submanager.settings.notifications.reports')}
              description={t('submanager.settings.notifications.reportsDescription')}
            />
          </div>
        </div>
      </section>

      <section className="submanager-settings-card submanager-settings-page__preferences">
        <div className="submanager-settings-page__preference-group">
          <span className="submanager-settings-page__preference-label">
            {t('submanager.settings.appearance.label')}
          </span>
          <SegmentedControl
            name={t('submanager.settings.appearance.label')}
            options={appearanceOptions}
            value={settings.appearance}
            onChange={(value) => {
              if (value !== 'light' && value !== 'dark' && value !== 'system') return;
              const mode: ThemeMode = value;
              setThemeMode(mode);
              setSettings((current) => current ? { ...current, appearance: mode } : current);
              setHasSaved(false);
            }}
          />
        </div>
        <div className="submanager-settings-page__preference-group">
          <span className="submanager-settings-page__preference-label">
            {t('submanager.settings.language.label')}
          </span>
          <SegmentedControl
            name={t('submanager.settings.language.label')}
            options={languageOptions}
            value={settings.language}
            onChange={(value) => {
              if (value !== 'ar' && value !== 'en') return;
              const nextLanguage: Language = value;
              setLanguage(nextLanguage);
              setSettings((current) => current ? { ...current, language: nextLanguage } : current);
              setHasSaved(false);
            }}
          />
        </div>
      </section>
    </div>
  );
}

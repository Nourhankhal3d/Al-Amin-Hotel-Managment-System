import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Bell,
  Building2,
  Check,
  FileText,
  Globe,
  KeyRound,
  Moon,
  Palette,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { PageHero } from '../../../components/common/PageHero';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Switch } from '../../../components/ui/Switch';
import { useToast } from '../../../components/ui/ToastContext';
import { getAuthSession } from '../../../core/auth/authManager';
import { ROUTES } from '../../../core/constants/routes';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { useTheme } from '../../../core/theme/useTheme';
import type { ThemeMode } from '../../../core/theme/themeContextInstance';
import './SettingsPage.css';

type NotificationKey = 'housekeeping' | 'rooms' | 'payments' | 'maintenance' | 'handover' | 'pending';
type SectionId = 'account' | 'notifications' | 'appearance' | 'security';

interface Settings {
  email: string;
  displayName: string;
  phone: string;
  notifications: Record<NotificationKey, boolean>;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  section?: SectionId;
  onSelect?: () => void;
}

const SETTINGS_STORAGE_KEY = 'al-amin-figma-settings';
const notificationKeys: NotificationKey[] = [
  'rooms',
  'housekeeping',
  'maintenance',
  'payments',
  'pending',
  'handover',
];

function createDefaultSettings(displayName: string): Settings {
  return {
    email: 'reception@alaminhotel.com',
    displayName,
    phone: '+20 100 000 0000',
    notifications: {
      housekeeping: true,
      rooms: true,
      payments: true,
      maintenance: true,
      handover: true,
      pending: true,
    },
  };
}

function loadSettings(defaults: Settings): Settings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaults;
    const saved = parsed as Partial<Settings>;
    const notifications = saved.notifications;

    return {
      email: typeof saved.email === 'string' ? saved.email : defaults.email,
      displayName: typeof saved.displayName === 'string' ? saved.displayName : defaults.displayName,
      phone: typeof saved.phone === 'string' ? saved.phone : defaults.phone,
      notifications: {
        ...defaults.notifications,
        ...(typeof notifications === 'object' && notifications !== null ? notifications : {}),
      },
    };
  } catch (error) {
    console.warn('Could not read saved settings; using defaults.', error);
    return defaults;
  }
}

export function SettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { language, setLanguage, t, dir } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();
  const session = getAuthSession();
  const [settings, setSettings] = useState(() => (
    loadSettings(createDefaultSettings(session?.staffName || t('topbar.userName')))
  ));
  const [activeNavigation, setActiveNavigation] = useState('profile');

  const navigationItems: NavigationItem[] = [
    { id: 'profile', label: t('settingsPage.nav.profile'), icon: UserCircle, section: 'account' },
    { id: 'language', label: t('settingsPage.nav.language'), icon: Globe, section: 'appearance' },
    { id: 'notifications', label: t('settingsPage.nav.notifications'), icon: Bell, section: 'notifications' },
    { id: 'theme', label: t('settingsPage.nav.theme'), icon: Palette, section: 'appearance' },
    { id: 'preferences', label: t('settingsPage.nav.preferences'), icon: SlidersHorizontal, section: 'appearance' },
    { id: 'security', label: t('settingsPage.nav.security'), icon: ShieldCheck, section: 'security' },
    { id: 'switch', label: t('settingsPage.nav.switch'), icon: ArrowLeftRight, onSelect: () => navigate(ROUTES.login) },
  ];

  const themeOptions: Array<{ value: ThemeMode; label: string; icon: LucideIcon }> = [
    { value: 'light', label: t('settingsPage.appearance.light'), icon: Sun },
    { value: 'dark', label: t('settingsPage.appearance.dark'), icon: Moon },
    { value: 'system', label: t('settingsPage.appearance.system'), icon: Building2 },
  ];

  function handleNavigation(item: NavigationItem) {
    setActiveNavigation(item.id);
    if (item.onSelect) {
      item.onSelect();
      return;
    }
    if (item.section) {
      document.getElementById(`settings-${item.section}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  function saveSettings() {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      toast.notify(t('settingsPage.saved'), 'success');
    } catch (error) {
      console.error('Could not save settings.', error);
      toast.notify(t('settingsPage.saveError'), 'error');
    }
  }

  function exportSettings() {
    const file = new Blob(
      [JSON.stringify({ ...settings, language, theme: themeMode }, null, 2)],
      { type: 'application/json' },
    );
    const objectUrl = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'al-amin-preferences.json';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    toast.notify(t('settingsPage.exported'), 'success');
  }

  function updateNotification(key: NotificationKey, checked: boolean) {
    setSettings((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: checked },
    }));
  }

  function updateAccount(field: 'email' | 'displayName' | 'phone', value: string) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function showPasswordNotice() {
    toast.notify(t('settingsPage.security.soon'), 'warning');
  }

  return (
    <div className="feature-page settings-page" dir={dir} lang={language}>
      <PageHero
        eyebrow={t('settingsPage.eyebrow')}
        title={t('settingsPage.title')}
        description={t('settingsPage.description')}
      >
        <Button variant="gold" onClick={saveSettings}>
          <Check aria-hidden="true" />
          {t('settingsPage.save')}
        </Button>
        <Button variant="glass" onClick={exportSettings}>
          <FileText aria-hidden="true" />
          {t('settingsPage.export')}
        </Button>
      </PageHero>

      <div className="settings-layout">
        <Card className="settings-sidebar">
          <h2 className="settings-sidebar__title">
            <SettingsIcon aria-hidden="true" />
            {t('settingsPage.account.title')}
          </h2>
          <nav className="settings-sidebar__nav" aria-label={t('settingsPage.nav.label')}>
            {navigationItems.map(({ id, label, icon: Icon, ...item }) => (
              <button
                className={`settings-sidebar__link${activeNavigation === id ? ' settings-sidebar__link--active' : ''}`}
                type="button"
                key={id}
                aria-current={activeNavigation === id ? 'page' : undefined}
                onClick={() => handleNavigation({ id, label, icon: Icon, ...item })}
              >
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </Card>

        <main className="settings-main" aria-label={t('settingsPage.title')}>
          <Card className="settings-card" id="settings-account">
            <header className="settings-card__header">
              <span className="settings-card__header-icon"><UserCircle aria-hidden="true" /></span>
              <div>
                <h2>{t('settingsPage.account.title')}</h2>
                <p>{t('settingsPage.account.subtitle')}</p>
              </div>
            </header>
            <div className="settings-account-grid">
              <label className="settings-field">
                <span>{t('settingsPage.account.name')}</span>
                <Input
                  autoComplete="name"
                  value={settings.displayName}
                  onChange={(event) => updateAccount('displayName', event.target.value)}
                />
              </label>
              <label className="settings-field">
                <span>{t('settingsPage.account.email')}</span>
                <Input
                  type="email"
                  autoComplete="email"
                  value={settings.email}
                  onChange={(event) => updateAccount('email', event.target.value)}
                />
              </label>
              <label className="settings-field">
                <span>{t('settingsPage.account.phone')}</span>
                <Input
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  value={settings.phone}
                  onChange={(event) => updateAccount('phone', event.target.value)}
                />
              </label>
              <label className="settings-field">
                <span>{t('settingsPage.account.role')}</span>
                <Input value={t('settingsPage.account.roleValue')} readOnly aria-readonly="true" />
              </label>
            </div>
          </Card>

          <Card className="settings-card" id="settings-notifications">
            <header className="settings-card__header">
              <span className="settings-card__header-icon"><Bell aria-hidden="true" /></span>
              <div>
                <h2>{t('settingsPage.notifications.title')}</h2>
                <p>{t('settingsPage.notifications.subtitle')}</p>
              </div>
            </header>
            <div className="settings-notifications-grid">
              {notificationKeys.map((key) => (
                <Switch
                  className="settings-notification"
                  key={key}
                  label={t(`settingsPage.notifications.${key}`)}
                  description="تنبيه عند وجود تحديث مرتبط بالوردية"
                  checked={settings.notifications[key]}
                  onChange={(checked) => updateNotification(key, checked)}
                />
              ))}
            </div>
          </Card>

          <Card className="settings-card" id="settings-appearance">
            <header className="settings-card__header">
              <span className="settings-card__header-icon"><Palette aria-hidden="true" /></span>
              <div>
                <h2>{t('settingsPage.appearance.title')}</h2>
                <p>{t('settingsPage.appearance.subtitle')}</p>
              </div>
            </header>
            <div className="settings-appearance-grid">
              <section className="settings-choice-group" aria-label={t('settingsPage.appearance.theme')}>
                <h3>{t('settingsPage.appearance.theme')}</h3>
                <div className="settings-choice">
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      className={`settings-choice__button${themeMode === value ? ' settings-choice__button--active' : ''}`}
                      type="button"
                      key={value}
                      aria-pressed={themeMode === value}
                      onClick={() => setThemeMode(value)}
                    >
                      <Icon aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </section>
              <section className="settings-choice-group" aria-label={t('settingsPage.appearance.language')}>
                <h3>{t('settingsPage.appearance.language')}</h3>
                <div className="settings-choice">
                  <button
                    className={`settings-choice__button${language === 'ar' ? ' settings-choice__button--active' : ''}`}
                    type="button"
                    aria-pressed={language === 'ar'}
                    onClick={() => setLanguage('ar')}
                  >
                    العربية
                  </button>
                  <button
                    className={`settings-choice__button${language === 'en' ? ' settings-choice__button--active' : ''}`}
                    type="button"
                    aria-pressed={language === 'en'}
                    onClick={() => setLanguage('en')}
                  >
                    English
                  </button>
                </div>
              </section>
            </div>
          </Card>

          <Card className="settings-card settings-card--security" id="settings-security">
            <header className="settings-card__header">
              <span className="settings-card__header-icon"><KeyRound aria-hidden="true" /></span>
              <div>
                <h2>{t('settingsPage.security.title')}</h2>
                <p>{t('settingsPage.security.subtitle')}</p>
              </div>
              <Button variant="secondary" className="settings-security-button" onClick={showPasswordNotice}>
                {t('settingsPage.security.change')}
              </Button>
            </header>
          </Card>
        </main>
      </div>
    </div>
  );
}

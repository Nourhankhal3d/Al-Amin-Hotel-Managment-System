import { useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { useTheme } from '../../../core/theme/useTheme';

export function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();

  const [activeTab, setActiveTab] = useState<'hotel' | 'shifts' | 'notifications' | 'account'>('hotel');
  const [hotelName, setHotelName] = useState('فندق الأمين');
  const [location, setLocation] = useState('أسوان، مصر');
  const [floors, setFloors] = useState('3');
  const [totalRooms, setTotalRooms] = useState('36');

  // Notification states
  const [notifs, setNotifs] = useState({
    maintenance: true,
    housekeeping: true,
    payments: true,
    pendingTasks: true,
    shiftHandover: true,
    reports: false,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  function toggleNotifKey(key: keyof typeof notifs) {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="figma-settings-page">
      {/* Figma Header Banner */}
      <div className="figma-settings-banner">
        <div className="figma-banner__text">
          <span className="figma-banner__tag">{t('systemPreferences')}</span>
          <h1 className="figma-banner__title">{t('settings')}</h1>
          <p className="figma-banner__desc">{t('settingsSubtitle')}</p>
        </div>
        <div className="figma-banner__actions">
          <button type="button" className="figma-btn-export" onClick={() => alert(t('exportSettings'))}>
            ⚡ {t('exportSettings')}
          </button>
          <button type="button" className="figma-btn-save-gold" onClick={handleSave}>
            ✓ {t('save')}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="figma-alert figma-alert--success">
          {t('settingsSaved')}
        </div>
      )}

      {/* Settings Grid: Sidebar + Main Content */}
      <div className="figma-settings-grid">
        {/* Navigation Sidebar */}
        <aside className="figma-settings-sidebar">
          <button
            type="button"
            className={`figma-settings-nav-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <span className="nav-icon">👤</span> {t('account')}
          </button>
          <button
            type="button"
            className={`figma-settings-nav-btn ${activeTab === 'hotel' ? 'active' : ''}`}
            onClick={() => setActiveTab('hotel')}
          >
            <span className="nav-icon">🏨</span> {t('hotelInfo')}
          </button>
          <button
            type="button"
            className={`figma-settings-nav-btn ${activeTab === 'shifts' ? 'active' : ''}`}
            onClick={() => setActiveTab('shifts')}
          >
            <span className="nav-icon">🕒</span> {t('shiftConfig')}
          </button>
          <button
            type="button"
            className={`figma-settings-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="nav-icon">🔔</span> {t('notifications')}
          </button>
        </aside>

        {/* Main Settings Sections */}
        <main className="figma-settings-content">
          {/* Section 1: Hotel Info */}
          <section className="figma-section-card">
            <div className="figma-section-header">
              <div>
                <h2>{t('hotelInfo')}</h2>
                <p>{t('hotelInfoDesc')}</p>
              </div>
              <span className="figma-badge-auto">{t('autoSaved')}</span>
            </div>

            <form onSubmit={handleSave} className="figma-fields-grid">
              <div className="figma-field-box">
                <label>{t('hotelNameLabel')}</label>
                <Input
                  className="figma-input-style"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                />
              </div>

              <div className="figma-field-box">
                <label>{t('locationLabel')}</label>
                <Input
                  className="figma-input-style"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="figma-field-box">
                <label>{t('totalRoomsLabel')}</label>
                <Input
                  className="figma-input-style"
                  value={totalRooms}
                  onChange={(e) => setTotalRooms(e.target.value)}
                />
              </div>

              <div className="figma-field-box">
                <label>{t('floorsLabel')}</label>
                <Input
                  className="figma-input-style"
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                />
              </div>
            </form>
          </section>

          {/* Section 2: Shift Configuration */}
          <section className="figma-section-card">
            <div className="figma-section-header">
              <div>
                <h2>{t('shiftConfig')}</h2>
                <p>{t('shiftsDesc')}</p>
              </div>
            </div>

            <div className="figma-shifts-list">
              <div className="figma-shift-item">
                <div className="shift-icon-box">🕥</div>
                <div className="shift-details">
                  <strong>{t('morningShift')}</strong>
                  <span>٠٧:٠٠ ص — ٠٤:٠٠ م</span>
                </div>
              </div>

              <div className="figma-shift-item">
                <div className="shift-icon-box">🌆</div>
                <div className="shift-details">
                  <strong>{t('eveningShift')}</strong>
                  <span>٠٤:٠٠ م — ١١:٠٠ م</span>
                </div>
              </div>

              <div className="figma-shift-item">
                <div className="shift-icon-box">🌙</div>
                <div className="shift-details">
                  <strong>{t('nightShift')}</strong>
                  <span>١١:٠٠ م — ٠٧:٠٠ ص</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Notification Toggles */}
          <section className="figma-section-card">
            <div className="figma-section-header">
              <div>
                <h2>{t('notifications')}</h2>
                <p>{t('notifDesc')}</p>
              </div>
            </div>

            <div className="figma-notif-grid">
              <div className="figma-notif-box">
                <div className="notif-info">
                  <strong>{t('maintenance')}</strong>
                  <span>{t('notifSubLabel')}</span>
                </div>
                <label className="figma-toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifs.maintenance}
                    onChange={() => toggleNotifKey('maintenance')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="figma-notif-box">
                <div className="notif-info">
                  <strong>{t('housekeeping')}</strong>
                  <span>{t('notifSubLabel')}</span>
                </div>
                <label className="figma-toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifs.housekeeping}
                    onChange={() => toggleNotifKey('housekeeping')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="figma-notif-box">
                <div className="notif-info">
                  <strong>{t('payments')}</strong>
                  <span>{t('notifSubLabel')}</span>
                </div>
                <label className="figma-toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifs.payments}
                    onChange={() => toggleNotifKey('payments')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="figma-notif-box">
                <div className="notif-info">
                  <strong>{t('pendingTasks')}</strong>
                  <span>{t('notifSubLabel')}</span>
                </div>
                <label className="figma-toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifs.pendingTasks}
                    onChange={() => toggleNotifKey('pendingTasks')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="figma-notif-box">
                <div className="notif-info">
                  <strong>{t('shiftHandover')}</strong>
                  <span>{t('notifSubLabel')}</span>
                </div>
                <label className="figma-toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifs.shiftHandover}
                    onChange={() => toggleNotifKey('shiftHandover')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="figma-notif-box">
                <div className="notif-info">
                  <strong>{t('reports')}</strong>
                  <span>{t('notifSubLabel')}</span>
                </div>
                <label className="figma-toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifs.reports}
                    onChange={() => toggleNotifKey('reports')}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </section>

          {/* Section 4: Theme & Language Controls Bar */}
          <section className="figma-bottom-bar-card">
            <div className="bottom-bar-group">
              <span className="bar-label">{t('themeLabel')}</span>
              <div className="figma-pill-selector">
                <button
                  type="button"
                  className={`pill-btn ${themeMode === 'light' ? 'active' : ''}`}
                  onClick={() => setThemeMode('light')}
                >
                  {t('themeLight')}
                </button>
                <button
                  type="button"
                  className={`pill-btn ${themeMode === 'dark' ? 'active' : ''}`}
                  onClick={() => setThemeMode('dark')}
                >
                  {t('themeDark')}
                </button>
                <button
                  type="button"
                  className={`pill-btn ${themeMode === 'system' ? 'active' : ''}`}
                  onClick={() => setThemeMode('system')}
                >
                  {t('themeSystem')}
                </button>
              </div>
            </div>

            <div className="bottom-bar-group">
              <span className="bar-label">{t('language')}</span>
              <div className="figma-pill-selector">
                <button
                  type="button"
                  className={`pill-btn ${language === 'ar' ? 'active' : ''}`}
                  onClick={() => setLanguage('ar')}
                >
                  العربية
                </button>
                <button
                  type="button"
                  className={`pill-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  English
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

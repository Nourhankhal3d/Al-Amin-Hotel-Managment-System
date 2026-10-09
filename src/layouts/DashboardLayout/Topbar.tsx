import { useEffect, useState } from 'react';
import { Bell, CalendarDays, Clock, Search } from 'lucide-react';
import { getTranslation } from '../../core/i18n';
import type { Language } from '../../core/i18n';
import { formatClock, formatLongDate } from '../../utils/format';
import './Topbar.css';

interface TopbarProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function Topbar({ language, onLanguageChange }: TopbarProps) {
  const [now, setNow] = useState(() => new Date());
  const t = (key: string) => getTranslation(language, key);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="topbar">
      <label className="topbar__search-wrap">
        <Search className="topbar__search-icon" aria-hidden="true" />
        <input className="topbar__search" aria-label={t('search')} placeholder={t('topbar.searchRooms')} />
        <kbd className="topbar__shortcut">{t('topbar.searchShortcut')}</kbd>
      </label>

      <div className="topbar__actions">
        <span className="topbar__date" aria-label={t('topbar.date')}>
          <CalendarDays aria-hidden="true" />
          <span>{formatLongDate(now, language)}</span>
        </span>
        <span className="topbar__time" aria-label={t('topbar.time')}>
          <Clock aria-hidden="true" />
          <span>{formatClock(now, language)}</span>
        </span>

        <button type="button" className="topbar__language" onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}>
          {language === 'ar' ? 'EN' : 'AR'}
        </button>

        <button type="button" aria-label={t('topbar.notifications')} className="topbar__notification">
          <Bell aria-hidden="true" />
          <span className="topbar__notification-dot" />
        </button>

        <div className="topbar__user">
          <span className="topbar__avatar">{t('topbar.userName')}</span>
          <span className="topbar__user-role">{t('topbar.userRole')}</span>
        </div>
      </div>
    </header>
  );
}

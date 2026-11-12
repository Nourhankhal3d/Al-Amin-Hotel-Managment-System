import React, { useEffect, useState, useRef } from 'react';
import { Bell, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAuthSession } from '../../core/auth/authManager';
import { useLanguage } from '../../core/i18n/useLanguage';
import { formatClock } from '../../utils/format';
import { Avatar } from '../../components/ui/Avatar';
import { request } from '../../core/api/apiClient';
import './SubManagerTopbar.css';

export interface SubManagerTopbarProps {
  onLanguageChange?: (language: 'ar' | 'en') => void;
}

interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
}

export function SubManagerTopbar({ onLanguageChange }: SubManagerTopbarProps): React.ReactElement {
  const [now, setNow] = useState(() => new Date());
  const [sessionTick, setSessionTick] = useState(0);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleSessionUpdate = () => setSessionTick((n) => n + 1);
    window.addEventListener('al-amin-session-updated', handleSessionUpdate);
    return () => window.removeEventListener('al-amin-session-updated', handleSessionUpdate);
  }, []);
  void sessionTick;

  const session = getAuthSession();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const defaultRoleNames = ['مدير الفندق', 'المدير الفرعي', 'حساب المدير الفرعي', 'Sub-Manager', 'Sub-Manager Account'];
  const hasCustomName = Boolean(
    session?.staffName && !defaultRoleNames.includes(session.staffName.trim()),
  );
  const staffName = hasCustomName
    ? session!.staffName
    : t('submanager.shell.topbar.userName');
  const roleSubtitle = t('submanager.shell.topbar.userRole');
  const avatarLetter = t('submanager.shell.topbar.userAvatar');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Debounced search query (reuses existing search endpoint when available)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const res = await request<{ data: SearchResultItem[] }>('/search', {
          params: { q: searchQuery },
        });
        setSearchResults(res.data || []);
      } catch {
        setSearchResults([]);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleToggleLanguage() {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    if (onLanguageChange) {
      onLanguageChange(nextLang);
    } else {
      setLanguage(nextLang);
    }
  }

  return (
    <header className="submanager-topbar">
      <div className="submanager-topbar__search-wrap" ref={searchWrapRef}>
        <Search className="submanager-topbar__search-icon" aria-hidden="true" />
        <input
          type="search"
          className="submanager-topbar__search-input"
          placeholder={t('submanager.shell.topbar.searchPlaceholder')}
          aria-label={t('submanager.shell.topbar.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />
        <kbd className="submanager-topbar__shortcut">{t('submanager.shell.topbar.searchShortcut')}</kbd>

        {showDropdown && searchResults.length > 0 && (
          <ul className="submanager-topbar__search-results" role="listbox">
            {searchResults.map((item) => (
              <li
                key={item.id}
                className="submanager-topbar__search-item"
                role="option"
                aria-selected={false}
                onClick={() => {
                  setShowDropdown(false);
                  setSearchQuery('');
                }}
              >
                <strong className="submanager-topbar__search-item-title">{item.title}</strong>
                <span className="submanager-topbar__search-item-sub">{item.subtitle}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="submanager-topbar__actions">
        <div className="submanager-topbar__time" aria-label={formatClock(now, language)}>
          <Clock className="submanager-topbar__time-icon" aria-hidden="true" />
          <span className="submanager-topbar__time-text">{formatClock(now, language)}</span>
        </div>

        <button
          type="button"
          className="submanager-topbar__btn submanager-topbar__lang-btn"
          onClick={handleToggleLanguage}
          aria-label={t('submanager.shell.topbar.languageToggle') || 'Toggle language'}
        >
          {language === 'ar' ? 'EN' : 'العربية'}
        </button>

        <button
          type="button"
          className="submanager-topbar__btn submanager-topbar__bell-btn"
          aria-label={t('submanager.shell.topbar.notifications') || 'Notifications'}
        >
          <Bell className="submanager-topbar__bell-icon" aria-hidden="true" />
          <span className="submanager-topbar__bell-dot" aria-hidden="true" />
        </button>

        <div className="submanager-topbar__user-chip">
          <Avatar
            letter={avatarLetter}
            size="md"
            variant="primary"
            className="submanager-topbar__avatar"
          />
          <div className="submanager-topbar__user-info">
            <strong className="submanager-topbar__user-name">{staffName}</strong>
            <span className="submanager-topbar__user-role">{roleSubtitle}</span>
          </div>
          {language === 'ar' ? (
            <ChevronLeft className="submanager-topbar__chevron" aria-hidden="true" />
          ) : (
            <ChevronRight className="submanager-topbar__chevron" aria-hidden="true" />
          )}
        </div>
      </div>
    </header>
  );
}


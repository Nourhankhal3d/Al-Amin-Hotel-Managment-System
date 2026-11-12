import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Wallet,
  FileText,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { clearAuthSession } from '../../core/auth/authManager';
import { logoutRequest } from '../../features/auth/services/auth.api';
import { ROUTES } from '../../core/constants/routes';
import { useLanguage } from '../../core/i18n/useLanguage';
import './SubManagerSidebar.css';

const subManagerSidebarItems = [
  { key: 'dashboard', path: ROUTES.subManagerDashboard, icon: LayoutGrid },
  { key: 'finance', path: ROUTES.subManagerFinance, icon: Wallet },
  { key: 'reports', path: ROUTES.subManagerReports, icon: FileText },
  { key: 'profile', path: ROUTES.subManagerProfile, icon: User },
  { key: 'settings', path: ROUTES.subManagerSettings, icon: Settings },
] as const;

export function SubManagerSidebar(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // Local logout must proceed even if the server call fails
    }
    clearAuthSession();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <aside className="submanager-sidebar">
      <div className="submanager-sidebar__brand">
        <div className="submanager-sidebar__logo-tile">
          <img src="/hotel-logo.png" alt={t('submanager.shell.brand')} className="submanager-sidebar__logo-img" />
          <div className="submanager-sidebar__brand-copy">
            <strong className="submanager-sidebar__brand-name">{t('submanager.shell.brand')}</strong>
            <span className="submanager-sidebar__brand-location">{t('submanager.shell.location')}</span>
          </div>
        </div>
      </div>

      <p className="submanager-sidebar__section-label">{t('submanager.shell.section')}</p>

      <nav className="submanager-sidebar__nav" aria-label={t('submanager.shell.section')}>
        {subManagerSidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== ROUTES.subManagerDashboard && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`submanager-sidebar__link ${isActive ? 'submanager-sidebar__link--active' : ''}`}
            >
              <Icon className="submanager-sidebar__link-icon" aria-hidden="true" />
              <span className="submanager-sidebar__link-text">{t(`submanager.shell.nav.${item.key}`)}</span>
              {isActive && <span className="submanager-sidebar__link-dot" aria-hidden="true" />}
            </NavLink>
          );
        })}
      </nav>

      <div className="submanager-sidebar__footer">
        <div className="submanager-sidebar__status-card" role="status">
          <div className="submanager-sidebar__status-copy">
            <strong className="submanager-sidebar__status-title">{t('submanager.shell.statusCard.title')}</strong>
            <span className="submanager-sidebar__status-subtitle">{t('submanager.shell.statusCard.subtitle')}</span>
          </div>
          <span className="submanager-sidebar__status-dot" aria-hidden="true" />
        </div>

        <button type="button" className="submanager-sidebar__logout" onClick={handleLogout}>
          <LogOut className="submanager-sidebar__logout-icon" aria-hidden="true" />
          <span>{t('submanager.shell.logout')}</span>
        </button>
      </div>
    </aside>
  );
}


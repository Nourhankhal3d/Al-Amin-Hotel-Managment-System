import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, BedDouble, FileText, LayoutGrid, LogOut, Settings, Sparkles, User, Wallet, Wrench } from 'lucide-react';
import { Logo } from '../../components/common/Logo';
import { clearAuthSession } from '../../core/auth/authManager';
import { ROUTES } from '../../core/constants/routes';
import type { Language } from '../../core/i18n';
import { getTranslation } from '../../core/i18n';
import { formatNumber } from '../../utils/format';
import { mockShiftSummary } from '../../mocks/dashboard';
import './Sidebar.css';

const items = [
  { labelKey: 'nav.dashboard', path: ROUTES.dashboard, icon: LayoutGrid },
  { labelKey: 'nav.rooms', path: ROUTES.rooms, icon: BedDouble },
  { labelKey: 'nav.housekeeping', path: ROUTES.housekeeping, icon: Sparkles },
  { labelKey: 'nav.maintenance', path: ROUTES.maintenance, icon: Wrench },
  { labelKey: 'nav.payments', path: ROUTES.payments, icon: Wallet },
  { labelKey: 'nav.shiftHandover', path: ROUTES.shiftHandover, icon: ArrowLeftRight },
  { labelKey: 'nav.shiftReport', path: ROUTES.shiftReport, icon: FileText },
  { labelKey: 'nav.profile', path: ROUTES.profile, icon: User },
  { labelKey: 'nav.settings', path: ROUTES.settings, icon: Settings },
] as const;

interface SidebarProps {
  language: Language;
}

export function Sidebar({ language }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const t = (key: string) => getTranslation(language, key);
  const shiftEnds = t('sidebar.shiftEnds')
    .replace('{hours}', formatNumber(mockShiftSummary.remainingHours, language))
    .replace('{minutes}', formatNumber(mockShiftSummary.remainingMinutes, language));

  function handleLogout() {
    clearAuthSession();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo-tile"><Logo className="sidebar__logo" /></span>
        <span className="sidebar__brand-copy">
          <strong>{t('sidebar.brand')}</strong>
          <span>{t('sidebar.location')}</span>
        </span>
      </div>

      <p className="sidebar__section-label">{t('sidebar.section')}</p>
      <nav className="sidebar__navigation" aria-label={t('sidebar.section')}>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar__link${isActive || location.pathname.startsWith(item.path) ? ' sidebar__link--active' : ''}`}
          >
            <item.icon className="sidebar__link-icon" aria-hidden="true" />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <section className="sidebar__shift-card" aria-label={t('sidebar.shiftTitle')}>
        <span className="sidebar__shift-copy">
          <strong>{t('sidebar.shiftTitle')}</strong>
          <span>{shiftEnds}</span>
        </span>
        <span className="sidebar__shift-indicator" aria-hidden="true" />
      </section>

      <button type="button" className="sidebar__logout" onClick={handleLogout}>
        <LogOut aria-hidden="true" />
        <span>{t('sidebar.logout')}</span>
      </button>
    </aside>
  );
}

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, BedDouble, FileText, LayoutGrid, LogOut, NotebookText, Settings, Sparkles, User, Wallet, Wrench } from 'lucide-react';

import { Logo } from '../../components/common/Logo';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { clearAuthSession } from '../../core/auth/authManager';
import { logoutRequest } from '../../features/auth/services/auth.api';
import { ROUTES } from '../../core/constants/routes';
import type { Language } from '../../core/i18n';
import { getTranslation } from '../../core/i18n';
import { formatNumber } from '../../utils/format';
import { computeShiftProgress, useCurrentShift } from '../../features/shift-handover/services/currentShift';
import './Sidebar.css';

const items = [
  { labelKey: 'nav.dashboard', path: ROUTES.dashboard, icon: LayoutGrid },
  { labelKey: 'nav.rooms', path: ROUTES.rooms, icon: BedDouble },
  { labelKey: 'nav.housekeeping', path: ROUTES.housekeeping, icon: Sparkles },
  { labelKey: 'nav.maintenance', path: ROUTES.maintenance, icon: Wrench },
  { labelKey: 'nav.payments', path: ROUTES.payments, icon: Wallet },
  { labelKey: 'nav.shiftHandover', path: ROUTES.shiftHandover, icon: ArrowLeftRight },
  { labelKey: 'nav.shiftReport', path: ROUTES.shiftReport, icon: FileText },
  { labelKey: 'nav.guestSurveys', path: ROUTES.guestSurveys, icon: NotebookText },
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
  const { data: currentShift } = useCurrentShift();
  const [now, setNow] = useState(() => new Date());
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  // Warn (not block) when the receptionist leaves without handing the shift over
  const shiftNotHandedOver = currentShift?.status === 'active';

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!shiftNotHandedOver) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [shiftNotHandedOver]);

  const progress = currentShift ? computeShiftProgress(currentShift, now) : null;
  const shiftTitle = currentShift
    ? `${t('handoverPage.info.shift')}: ${t(`handoverPage.shiftType.${currentShift.shift_type}`)}`
    : t('handoverPage.info.shift');
  const shiftEnds = !currentShift || !progress
    ? '—'
    : progress.ended
      ? `${currentShift.start_time} — ${currentShift.end_time}`
      : t('sidebar.shiftEnds')
          .replace('{hours}', formatNumber(progress.remainingHours, language))
          .replace('{minutes}', formatNumber(progress.remainingMinutes, language));

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // the local logout below must happen even if the server call fails
    }
    clearAuthSession();
    navigate(ROUTES.login, { replace: true });
  }

  function requestLogout() {
    if (shiftNotHandedOver) setConfirmingLogout(true);
    else void handleLogout();
  }

  return (
    <>
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

        <section className="sidebar__shift-card" aria-label={shiftTitle}>
          <span className="sidebar__shift-copy">
            <strong>{shiftTitle}</strong>
            <span>{shiftEnds}</span>
          </span>
          <span className="sidebar__shift-indicator" aria-hidden="true" />
        </section>

        <button type="button" className="sidebar__logout" onClick={requestLogout}>
          <LogOut aria-hidden="true" />
          <span>{t('sidebar.logout')}</span>
        </button>
      </aside>

      {confirmingLogout && createPortal(
        <ConfirmDialog
          variant="danger"
          title={t('handoverPage.logoutWarnTitle')}
          description={t('handoverPage.logoutWarnDesc')}
          confirmLabel={t('handoverPage.logoutWarnConfirm')}
          cancelLabel={t('handoverPage.logoutWarnStay')}
          onConfirm={() => void handleLogout()}
          onCancel={() => setConfirmingLogout(false)}
        />,
        document.body,
      )}
    </>
  );
}
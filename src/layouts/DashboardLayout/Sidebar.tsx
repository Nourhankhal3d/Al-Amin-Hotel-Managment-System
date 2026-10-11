import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { ROUTES } from '../../core/constants/routes';
import { useShiftSummary } from '../../features/shift-handover/hooks/useShiftHandover';

const items = [
  { labelKey: 'dashboard', path: ROUTES.dashboard, icon: 'dashboard' },
  { labelKey: 'rooms', path: ROUTES.rooms, icon: 'rooms' },
  { labelKey: 'housekeeping', path: ROUTES.housekeeping, icon: 'housekeeping' },
  { labelKey: 'maintenance', path: ROUTES.maintenance, icon: 'maintenance' },
  { labelKey: 'payments', path: ROUTES.payments, icon: 'payments' },
  { labelKey: 'shiftHandover', path: ROUTES.shiftHandover, icon: 'handover' },
  { labelKey: 'shiftReport', path: ROUTES.shiftReport, icon: 'report' },
  { labelKey: 'profile', path: ROUTES.profile, icon: 'profile' },
  { labelKey: 'settings', path: ROUTES.settings, icon: 'settings' },
] as const;

const handoverLabels = {
  dashboard: 'لوحة التحكم',
  rooms: 'الغرف',
  housekeeping: 'التنظيف',
  maintenance: 'الصيانة',
  payments: 'المدفوعات',
  shiftHandover: 'الوردية والتسليم',
  shiftReport: 'تقرير الوردية',
  profile: 'الملف الشخصي',
  settings: 'الإعدادات',
} as const;

type SidebarIconName = (typeof items)[number]['icon'] | 'logout';

function SidebarIcon({ name }: { name: SidebarIconName }) {
  const icons = {
    dashboard: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    rooms: <><path d="M3 19v-8h18v8M3 15h18M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" /><path d="M5 19v-4m14 4v-4" /></>,
    housekeeping: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" /></>,
    maintenance: <><path d="M14.5 6.5a5 5 0 0 0-6.7 6.7L3 18l3 3 4.8-4.8a5 5 0 0 0 6.7-6.7L14 13l-3-3 3.5-3.5Z" /></>,
    payments: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18m-5 5h2" /></>,
    handover: <><path d="M7 7h13l-3-3m3 3-3 3M17 17H4l3 3m-3-3 3-3" /></>,
    report: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7m-7 4h7" /></>,
    profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.2.9-1.5 2.6-1.4-.6a8 8 0 0 1-1.7 1l-.2 1.5h-3l-.2-1.5a8 8 0 0 1-1.7-1l-1.4.6-1.5-2.6 1.2-.9a8 8 0 0 1 0-2l-1.2-.9 1.5-2.6 1.4.6a8 8 0 0 1 1.7-1l.2-1.5h3l.2 1.5a8 8 0 0 1 1.7 1l1.4-.6 1.5 2.6-1.2.9a8 8 0 0 1 0 1.9Z" /></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  };

  return (
    <svg className="sidebar__nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

export function Sidebar() {
  const location = useLocation();
  const isHandoverView = location.pathname === ROUTES.shiftHandover
    || location.pathname === '/__dev/shift-handover';
  const { data: shiftSummary } = useShiftSummary(isHandoverView);
  const shiftTypeLabels = {
    morning: 'الصباحية',
    evening: 'المسائية',
    night: 'الليلية',
  } as const;

  return (
    <aside className={`sidebar${isHandoverView ? ' sidebar--handover' : ''}`}>
      <div className="sidebar__brand sidebar__brand--with-logo">
        <Logo className="sidebar__logo" />
        <div className="sidebar__brand-copy">
          <strong>الأمين</strong>
          <span>فندق - أسوان</span>
        </div>
      </div>
      {isHandoverView && <div className="sidebar__workspace-tag">مساحة عمل الوردية</div>}
      <nav aria-label="Primary navigation">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => isActive || location.pathname.startsWith(item.path) || (isHandoverView && item.path === ROUTES.shiftHandover) ? 'active' : ''}
          >
            {isHandoverView && <SidebarIcon name={item.icon} />}
            <span>{isHandoverView ? handoverLabels[item.labelKey] : item.labelKey}</span>
          </NavLink>
        ))}
      </nav>
      {isHandoverView && shiftSummary && (
        <div className="sidebar__shift-status">
          <span className="sidebar__shift-status-dot" aria-hidden="true" />
          <div>
            <strong>الوردية {shiftTypeLabels[shiftSummary.shift.shift_type]}</strong>
            <span>تنتهي الساعة {shiftSummary.shift.end_time}</span>
          </div>
        </div>
      )}
      <button type="button" className="sidebar__logout">
        {isHandoverView ? <><span>تسجيل الخروج</span><SidebarIcon name="logout" /></> : 'logout'}
      </button>
    </aside>
  );
}

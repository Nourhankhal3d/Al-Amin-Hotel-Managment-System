import { NavLink } from 'react-router-dom';
import {
  BedIcon,
  ChartIcon,
  ClockIcon,
  LogoutIcon,
  ReceiptIcon,
  SettingsIcon,
  SparkIcon,
  TransferIcon,
  UserIcon,
  WalletIcon,
  WrenchIcon,
} from '../../components/ui/Icons';
import { ROUTES } from '../../core/constants/routes';

const items = [
  { label: 'لوحة التحكم', path: ROUTES.dashboard, icon: ChartIcon },
  { label: 'الغرف', path: ROUTES.rooms, icon: BedIcon },
  { label: 'التنظيف', path: ROUTES.housekeeping, icon: SparkIcon },
  { label: 'الصيانة', path: ROUTES.maintenance, icon: WrenchIcon },
  { label: 'المدفوعات', path: ROUTES.payments, icon: WalletIcon },
  { label: 'الوردية والتسليم', path: ROUTES.shiftHandover, icon: TransferIcon },
  { label: 'تقرير الوردية', path: ROUTES.shiftReport, icon: ReceiptIcon },
  { label: 'الملف الشخصي', path: ROUTES.profile, icon: UserIcon },
  { label: 'الإعدادات', path: ROUTES.settings, icon: SettingsIcon },
] as const;

export function Sidebar() {
  return (
    <aside className="sidebar" dir="rtl">
      <header className="sidebar__brand">
        <div className="sidebar__brand-main">
          <span className="sidebar__logo-card">
            <img className="sidebar__logo" src="/al-amin-hotel-logo.png" alt="شعار فندق الأمين" />
          </span>
          <div className="sidebar__brand-copy">
            <strong>الأمين</strong>
            <span>فندق أسوان</span>
          </div>
        </div>
        <span className="sidebar__workspace">مساحة عمل الوردية</span>
      </header>

      <nav aria-label="التنقل الرئيسي">
        {items.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
            <item.icon className="sidebar__nav-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <section className="sidebar__shift-status" aria-label="حالة الوردية">
        <span className="sidebar__shift-status-icon"><ClockIcon /></span>
        <span className="sidebar__shift-status-copy">
          <strong>الوردية الصباحية</strong>
          <span>تنتهي خلال ٣ س و ١٨ د</span>
        </span>
        <span className="sidebar__shift-status-badge" aria-hidden="true" />
      </section>

      <button type="button" className="sidebar__logout">
        <LogoutIcon className="sidebar__nav-icon" />
        <span>تسجيل الخروج</span>
      </button>
    </aside>
  );
}

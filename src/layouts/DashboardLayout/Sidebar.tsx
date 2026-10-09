import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../core/constants/routes';

const items = [
  { labelKey: 'dashboard', path: ROUTES.dashboard },
  { labelKey: 'rooms', path: ROUTES.rooms },
  { labelKey: 'housekeeping', path: ROUTES.housekeeping },
  { labelKey: 'maintenance', path: ROUTES.maintenance },
  { labelKey: 'payments', path: ROUTES.payments },
  { labelKey: 'shiftHandover', path: ROUTES.shiftHandover },
  { labelKey: 'shiftReport', path: ROUTES.shiftReport },
  { labelKey: 'personalShift', path: ROUTES.personalShift },
  { labelKey: 'profile', path: ROUTES.profile },
  { labelKey: 'settings', path: ROUTES.settings },
] as const;

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand"><strong>أمين</strong><span>Hotel Management</span></div>
      <nav aria-label="Primary navigation">
        {items.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive || location.pathname.startsWith(item.path) ? 'active' : ''}>
            {item.labelKey}
          </NavLink>
        ))}
      </nav>
      <button type="button" className="sidebar__logout">logout</button>
    </aside>
  );
}

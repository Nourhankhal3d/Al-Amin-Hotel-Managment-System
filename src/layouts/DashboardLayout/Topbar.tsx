import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDirection } from '../../core/hooks/useDirection';
import type { Language } from '../../core/i18n';
import { ROUTES } from '../../core/constants/routes';

export function Topbar() {
  const [language, setLanguage] = useState<Language>('ar');
  const location = useLocation();
  const isHandoverView = location.pathname === ROUTES.shiftHandover
    || location.pathname === '/__dev/shift-handover';
  useDirection(language);

  const currentTime = new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
  return (
    <header className={`topbar${isHandoverView ? ' topbar--handover' : ''}`}>
      {isHandoverView ? (
        <div className="topbar__search-wrap">
          <input className="topbar__search" aria-label="Search" placeholder="ابحث عن غرفة أو موظف..." />
          <svg className="topbar__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" />
          </svg>
        </div>
      ) : (
        <input className="topbar__search" aria-label="Search" placeholder="ابحث عن غرفة أو موظف..." />
      )}
      {isHandoverView && (
        <div className="topbar__handover-trailing">
          <div className="topbar__shift-time">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" />
            </svg>
            <span>{currentTime}</span>
          </div>
          <div className="topbar__actions topbar__actions--handover">
            <button type="button" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>{language === 'ar' ? 'EN' : 'العربية'}</button>
            <button type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" />
              </svg>
            </button>
            <div className="topbar__handover-user">
              <span className="topbar__handover-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="8" r="3" /><path d="M6 20a6 6 0 0 1 12 0" />
                </svg>
              </span>
              <div><strong>موظف الاستقبال</strong><span>الأمين</span></div>
            </div>
            <span className="topbar__back-mark" aria-hidden="true">‹</span>
          </div>
        </div>
      )}
      {!isHandoverView && (
        <div className="topbar__actions">
          <button type="button" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>{language === 'ar' ? 'EN' : 'العربية'}</button>
          <button type="button" aria-label="Notifications">الإشعارات</button>
          <div className="topbar__user"><strong> receptionist </strong><span>Receptionist</span></div>
        </div>
      )}
    </header>
  );
}

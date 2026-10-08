import { useState } from 'react';
import { useDirection } from '../../core/hooks/useDirection';
import type { Language } from '../../core/i18n';

export function Topbar() {
  const [language, setLanguage] = useState<Language>('ar');
  useDirection(language);

  return (
    <header className="topbar">
      <input className="topbar__search" aria-label="Search" placeholder="ابحث عن غرفة أو موظف..." />
      <div className="topbar__actions">
        <button type="button" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>{language === 'ar' ? 'EN' : 'العربية'}</button>
        <button type="button" aria-label="Notifications">الإشعارات</button>
        <div className="topbar__user"><strong> receptionist </strong><span>Receptionist</span></div>
      </div>
    </header>
  );
}

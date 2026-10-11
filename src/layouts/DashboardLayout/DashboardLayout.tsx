import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import type { Language } from '../../core/i18n';
import { useDirection } from '../../core/hooks/useDirection';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import './DashboardLayout.css';

export function DashboardLayout() {
  const [language, setLanguage] = useState<Language>('ar');
  useDirection(language);

  return (
    <div className="app-shell" lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar language={language} />
      <main className="app-main">
        <Topbar language={language} onLanguageChange={setLanguage} />
        <div className="app-content">
          <Outlet context={{ language }} />
        </div>
      </main>
    </div>
  );
}

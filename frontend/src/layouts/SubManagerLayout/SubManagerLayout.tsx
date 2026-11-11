import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLanguage } from '../../core/i18n/useLanguage';
import { SubManagerSidebar } from './SubManagerSidebar';
import { SubManagerTopbar } from './SubManagerTopbar';
import './SubManagerLayout.css';
import '../ManagerLayout/ManagerTheme.css';

export function SubManagerLayout(): React.ReactElement {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="submanager-shell" lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <SubManagerSidebar />
      <main className="submanager-main">
        <SubManagerTopbar onLanguageChange={setLanguage} />
        <div className="submanager-content">
          <Outlet context={{ language }} />
        </div>
      </main>
    </div>
  );
}


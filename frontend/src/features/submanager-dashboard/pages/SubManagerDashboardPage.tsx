import React from 'react';
import { useLanguage } from '../../../core/i18n/useLanguage';

export function SubManagerDashboardPage(): React.ReactElement {
  const { t } = useLanguage();

  return (
    <div className="submanager-page-placeholder">
      <h1>{t('submanager.dashboard.title')}</h1>
      <p>{t('submanager.dashboard.placeholder')}</p>
    </div>
  );
}


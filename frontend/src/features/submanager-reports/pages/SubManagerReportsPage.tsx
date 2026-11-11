import React from 'react';
import { useLanguage } from '../../../core/i18n/useLanguage';

export function SubManagerReportsPage(): React.ReactElement {
  const { t } = useLanguage();

  return (
    <div className="submanager-page-placeholder">
      <h1>{t('submanager.reports.title')}</h1>
      <p>{t('submanager.reports.placeholder')}</p>
    </div>
  );
}


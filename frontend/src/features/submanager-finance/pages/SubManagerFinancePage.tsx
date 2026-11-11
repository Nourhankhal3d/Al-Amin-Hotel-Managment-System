import React from 'react';
import { useLanguage } from '../../../core/i18n/useLanguage';

export function SubManagerFinancePage(): React.ReactElement {
  const { t } = useLanguage();

  return (
    <div className="submanager-page-placeholder">
      <h1>{t('submanager.finance.title')}</h1>
      <p>{t('submanager.finance.placeholder')}</p>
    </div>
  );
}


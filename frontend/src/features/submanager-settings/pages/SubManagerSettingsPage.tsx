import React from 'react';
import { useLanguage } from '../../../core/i18n/useLanguage';

export function SubManagerSettingsPage(): React.ReactElement {
  const { t } = useLanguage();

  return (
    <div className="submanager-page-placeholder">
      <h1>{t('submanager.settings.title')}</h1>
      <p>{t('submanager.settings.placeholder')}</p>
    </div>
  );
}


import React from 'react';
import { LogOut, Bell, Settings } from 'lucide-react';
import { useLanguage } from '../../../core/i18n/useLanguage';
import './SubManagerProfileActions.css';

export interface SubManagerProfileActionsProps {
  onLogout: () => void;
  onNotifications: () => void;
  onChangePassword: () => void;
}

export function SubManagerProfileActions({
  onLogout,
  onNotifications,
  onChangePassword,
}: SubManagerProfileActionsProps): React.ReactElement {
  const { t } = useLanguage();

  return (
    <div className="submanager-profile-actions">
      <button
        type="button"
        className="submanager-profile-actions__btn submanager-profile-actions__btn--danger"
        onClick={onLogout}
      >
        <LogOut className="submanager-profile-actions__icon" />
        <span>{t('submanager.profile.actions.logout')}</span>
      </button>

      <div className="submanager-profile-actions__group">
        <button
          type="button"
          className="submanager-profile-actions__btn"
          onClick={onNotifications}
        >
          <Bell className="submanager-profile-actions__icon" />
          <span>{t('submanager.profile.actions.notifications')}</span>
        </button>

        <button
          type="button"
          className="submanager-profile-actions__btn"
          onClick={onChangePassword}
        >
          <Settings className="submanager-profile-actions__icon" />
          <span>{t('submanager.profile.actions.changePassword')}</span>
        </button>
      </div>
    </div>
  );
}

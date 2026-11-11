import React from 'react';
import { useLanguage } from '../../../core/i18n/useLanguage';
import './SubManagerProfileHeader.css';

export interface SubManagerProfileHeaderProps {
  onEdit: () => void;
  onNotifications: () => void;
  name?: string;
  role?: string;
  hotel?: string;
  location?: string;
}

export function SubManagerProfileHeader({
  onEdit,
  onNotifications,
  name,
  role,
  hotel,
  location,
}: SubManagerProfileHeaderProps): React.ReactElement {
  const { t } = useLanguage();

  const displayRole = role || t('submanager.profile.role');
  const displayHotel = hotel || t('submanager.profile.hotel');
  const displayLocation = location || t('submanager.profile.location');

  return (
    <div className="submanager-profile-header">
      <div className="submanager-profile-header__actions">
        <button
          type="button"
          className="submanager-profile-header__btn-edit"
          onClick={onEdit}
        >
          {t('submanager.profile.editBtn')}
        </button>
        <button
          type="button"
          className="submanager-profile-header__btn-notif"
          onClick={onNotifications}
        >
          {t('submanager.profile.notificationBtn')}
        </button>
      </div>

      <div className="submanager-profile-header__identity">
        <div className="submanager-profile-header__meta">
          <span className="submanager-profile-header__eyebrow">
            {t('submanager.profile.eyebrow')}
          </span>
          <h1 className="submanager-profile-header__title">
            {name || t('submanager.profile.accountTitle')}
          </h1>
          <span className="submanager-profile-header__subtitle">
            {`${displayRole} · ${displayHotel}`}
          </span>
          <span className="submanager-profile-header__location">
            {displayLocation}
          </span>
        </div>

        <div className="submanager-profile-header__logo-tile">
          <img
            src="/hotel-logo.png"
            alt="Al-Amin Hotel"
            className="submanager-profile-header__logo-img"
          />
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useLanguage } from '../../../core/i18n/useLanguage';
import './SubManagerAccountInfo.css';

export interface SubManagerAccountInfoProps {
  email: string;
  phone: string;
  name?: string;
  role?: string;
  accountType?: string;
  lastLogin?: string;
  accountStatus?: string;
}

export function SubManagerAccountInfo({
  email,
  phone,
  name,
  role,
  accountType,
  lastLogin,
  accountStatus,
}: SubManagerAccountInfoProps): React.ReactElement {
  const { t } = useLanguage();

  const displayRole = role || t('submanager.profile.accountInfo.roleValue');
  const displayAccount = name || accountType || t('submanager.profile.accountInfo.accountValue');
  const displayLastLogin = lastLogin || t('submanager.profile.accountInfo.lastLoginValue');
  const displayStatus = accountStatus || t('submanager.profile.accountInfo.statusValue');

  return (
    <div className="submanager-account-info">
      <div className="submanager-account-info__header">
        <h2 className="submanager-account-info__title">
          {t('submanager.profile.accountInfo.title')}
        </h2>
        <p className="submanager-account-info__subtitle">
          {t('submanager.profile.accountInfo.subtitle')}
        </p>
      </div>

      <div className="submanager-account-info__grid">
        <div className="submanager-account-info__tile">
          <span className="submanager-account-info__label">
            {t('submanager.profile.accountInfo.roleLabel')}
          </span>
          <strong className="submanager-account-info__value">{displayRole}</strong>
        </div>

        <div className="submanager-account-info__tile">
          <span className="submanager-account-info__label">
            {t('submanager.profile.accountInfo.accountLabel')}
          </span>
          <strong className="submanager-account-info__value">{displayAccount}</strong>
        </div>

        <div className="submanager-account-info__tile">
          <span className="submanager-account-info__label">
            {t('submanager.profile.accountInfo.emailLabel')}
          </span>
          <strong className="submanager-account-info__value">{email}</strong>
        </div>

        <div className="submanager-account-info__tile">
          <span className="submanager-account-info__label">
            {t('submanager.profile.accountInfo.phoneLabel')}
          </span>
          <strong className="submanager-account-info__value" dir="ltr">{phone}</strong>
        </div>

        <div className="submanager-account-info__tile">
          <span className="submanager-account-info__label">
            {t('submanager.profile.accountInfo.lastLoginLabel')}
          </span>
          <strong className="submanager-account-info__value">{displayLastLogin}</strong>
        </div>

        <div className="submanager-account-info__tile">
          <span className="submanager-account-info__label">
            {t('submanager.profile.accountInfo.statusLabel')}
          </span>
          <strong className="submanager-account-info__value submanager-account-info__status-pill">
            {displayStatus}
          </strong>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { User, Bed, FileText, Check } from 'lucide-react';
import { useLanguage } from '../../../core/i18n/useLanguage';
import './SubManagerProfileStats.css';

export interface SubManagerProfileStatsData {
  managedEmployees?: number;
  managedRooms?: number;
  managedFloors?: number;
  reportsCreated?: number;
  managementTasks?: { total: number; completed: number };
}

export interface SubManagerProfileStatsProps {
  stats?: SubManagerProfileStatsData;
}

export function SubManagerProfileStats({ stats }: SubManagerProfileStatsProps): React.ReactElement {
  const { t } = useLanguage();

  const employeesCount = stats?.managedEmployees ?? 18;
  const roomsCount = stats?.managedRooms ?? 36;
  const reportsCount = stats?.reportsCreated ?? 28;
  const tasksTotal = stats?.managementTasks?.total ?? 12;

  return (
    <div className="submanager-profile-stats">
      <div className="submanager-profile-stats__card">
        <div className="submanager-profile-stats__info">
          <span className="submanager-profile-stats__title">
            {t('submanager.profile.stats.employeesTitle')}
          </span>
          <strong className="submanager-profile-stats__value">{employeesCount}</strong>
          <span className="submanager-profile-stats__subtitle">
            {t('submanager.profile.stats.employeesSubtitle')}
          </span>
        </div>
        <div className="submanager-profile-stats__icon-wrap submanager-profile-stats__icon-wrap--green">
          <User className="submanager-profile-stats__icon" />
        </div>
      </div>

      <div className="submanager-profile-stats__card">
        <div className="submanager-profile-stats__info">
          <span className="submanager-profile-stats__title">
            {t('submanager.profile.stats.roomsTitle')}
          </span>
          <strong className="submanager-profile-stats__value">{roomsCount}</strong>
          <span className="submanager-profile-stats__subtitle">
            {t('submanager.profile.stats.roomsSubtitle')}
          </span>
        </div>
        <div className="submanager-profile-stats__icon-wrap submanager-profile-stats__icon-wrap--green">
          <Bed className="submanager-profile-stats__icon" />
        </div>
      </div>

      <div className="submanager-profile-stats__card">
        <div className="submanager-profile-stats__info">
          <span className="submanager-profile-stats__title">
            {t('submanager.profile.stats.reportsTitle')}
          </span>
          <strong className="submanager-profile-stats__value">{reportsCount}</strong>
          <span className="submanager-profile-stats__subtitle">
            {t('submanager.profile.stats.reportsSubtitle')}
          </span>
        </div>
        <div className="submanager-profile-stats__icon-wrap submanager-profile-stats__icon-wrap--amber">
          <FileText className="submanager-profile-stats__icon" />
        </div>
      </div>

      <div className="submanager-profile-stats__card">
        <div className="submanager-profile-stats__info">
          <span className="submanager-profile-stats__title">
            {t('submanager.profile.stats.tasksTitle')}
          </span>
          <strong className="submanager-profile-stats__value">{tasksTotal}</strong>
          <span className="submanager-profile-stats__subtitle">
            {t('submanager.profile.stats.tasksSubtitle')}
          </span>
        </div>
        <div className="submanager-profile-stats__icon-wrap submanager-profile-stats__icon-wrap--amber">
          <Check className="submanager-profile-stats__icon" />
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { getAuthSession, clearAuthSession } from '../../../core/auth/authManager';
import { ROUTES } from '../../../core/constants/routes';
import { useLanguage } from '../../../core/i18n/useLanguage';

export function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const session = getAuthSession();

  // Dynamic user data from active auth session
  const [userProfile, setUserProfile] = useState({
    name: session?.userId ? `موظف ${session.userId}` : 'حساب الموظف',
    roleTitle: session?.role ? session.role : 'موظف الاستقبال',
    email: session?.userId ? `${session.userId}@alaminhotel.com` : 'staff@alaminhotel.com',
    phone: '+20 100 000 0000',
    location: 'أسوان، مصر',
    lastLogin: 'اليوم، 08:12 ص',
    status: 'نشط',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...userProfile });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleLogout() {
    clearAuthSession();
    navigate(ROUTES.login, { replace: true });
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setUserProfile({ ...editForm });
      setSaving(false);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 500);
  }

  return (
    <div className="figma-profile-page">
      {saveSuccess && (
        <div className="figma-alert figma-alert--success">
          {t('settingsSaved')}
        </div>
      )}

      {/* Hero Banner matching Figma Reference */}
      <div className="figma-profile-hero">
        <div className="figma-hero-meta">
          <span className="figma-hero-tag">{t('profile')}</span>
          <h1 className="figma-hero-title">{userProfile.name}</h1>
          <p className="figma-hero-subtitle">
            Al Amin Hotel • {userProfile.roleTitle} • {userProfile.location}
          </p>
        </div>

        <div className="figma-hero-logo-badge">
          <img src="/assets/logo.jpg" alt="Logo" />
        </div>

        <div className="figma-hero-actions">
          <Button
            type="button"
            className="figma-btn-white"
            onClick={() => {
              setEditForm({ ...userProfile });
              setIsEditing(true);
            }}
          >
            {t('editProfile')}
          </Button>
          <Button
            type="button"
            className="figma-btn-dark-emerald"
            onClick={() => navigate(ROUTES.settings)}
          >
            {t('notificationPreferences')}
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="figma-profile-stats">
        <div className="figma-stat-card">
          <div className="stat-icon-box stat-icon--green">👥</div>
          <div className="stat-content">
            <span className="stat-title">{t('activeStaff')}</span>
            <strong className="stat-val">18</strong>
            <span className="stat-sub">{t('allDepartments')}</span>
          </div>
        </div>

        <div className="figma-stat-card">
          <div className="stat-icon-box stat-icon--mint">🛏️</div>
          <div className="stat-content">
            <span className="stat-title">{t('managedRooms')}</span>
            <strong className="stat-val">36</strong>
            <span className="stat-sub">{t('floorsCount')}</span>
          </div>
        </div>

        <div className="figma-stat-card">
          <div className="stat-icon-box stat-icon--sand">📄</div>
          <div className="stat-content">
            <span className="stat-title">{t('generatedReports')}</span>
            <strong className="stat-val">28</strong>
            <span className="stat-sub">{t('thisMonth')}</span>
          </div>
        </div>

        <div className="figma-stat-card">
          <div className="stat-icon-box stat-icon--gold">✔️</div>
          <div className="stat-content">
            <span className="stat-title">{t('adminTasks')}</span>
            <strong className="stat-val">12</strong>
            <span className="stat-sub">{t('completedTasks')}</span>
          </div>
        </div>
      </div>

      {/* Split Columns: Activity & Account Info */}
      <div className="figma-profile-split">
        {/* Activity Log */}
        <div className="figma-card-panel">
          <div className="panel-header">
            <h2>{t('recentActivity')}</h2>
            <p>{t('lastActions')}</p>
          </div>
          <div className="figma-activity-list">
            <div className="activity-row">
              <div className="act-icon act-icon--green">💳</div>
              <div className="act-info">
                <strong>{t('activityPayment')}</strong>
                <span>{t('activityPaymentDesc')}</span>
              </div>
              <span className="act-time">11:42</span>
            </div>

            <div className="activity-row">
              <div className="act-icon act-icon--mint">✨</div>
              <div className="act-info">
                <strong>{t('activityHousekeeping')}</strong>
                <span>{t('activityHousekeepingDesc')}</span>
              </div>
              <span className="act-time">11:18</span>
            </div>

            <div className="activity-row">
              <div className="act-icon act-icon--sand">🔧</div>
              <div className="act-info">
                <strong>{t('activityMaintenance')}</strong>
                <span>{t('activityMaintenanceDesc')}</span>
              </div>
              <span className="act-time">10:56</span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="figma-card-panel">
          <div className="panel-header">
            <h2>{t('accountInfo')}</h2>
            <p>{t('contactAndAccess')}</p>
          </div>
          <div className="figma-info-grid">
            <div className="info-box">
              <span className="info-label">{t('role')}</span>
              <strong className="info-val">{userProfile.roleTitle}</strong>
            </div>

            <div className="info-box">
              <span className="info-label">{t('adminAccountTitle')}</span>
              <strong className="info-val">{userProfile.name}</strong>
            </div>

            <div className="info-box">
              <span className="info-label">{t('email')}</span>
              <strong className="info-val">{userProfile.email}</strong>
            </div>

            <div className="info-box">
              <span className="info-label">{t('phone')}</span>
              <strong className="info-val">{userProfile.phone}</strong>
            </div>

            <div className="info-box">
              <span className="info-label">{t('lastLogin')}</span>
              <strong className="info-val">{userProfile.lastLogin}</strong>
            </div>

            <div className="info-box">
              <span className="info-label">{t('accountStatus')}</span>
              <strong className="info-val info-val--active">{userProfile.status}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="figma-bottom-actions-bar">
        <button type="button" className="action-btn action-btn--danger" onClick={handleLogout}>
          <span>🚪</span> {t('logout')}
        </button>

        <button type="button" className="action-btn" onClick={() => navigate(ROUTES.login)}>
          <span>🔄</span> {t('switchAccount')}
        </button>

        <button type="button" className="action-btn" onClick={() => navigate(ROUTES.settings)}>
          <span>🔔</span> {t('notificationPreferences')}
        </button>

        <button type="button" className="action-btn" onClick={() => navigate(ROUTES.settings)}>
          <span>⚙️</span> {t('changePassword')}
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="ui-drawer-backdrop" onClick={() => setIsEditing(false)}>
          <div className="ui-dialog figma-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>{t('editProfile')}</h2>
            <form onSubmit={handleSaveProfile} className="figma-auth-form" style={{ marginTop: 14 }}>
              <div className="figma-form-group">
                <label>{t('fullNameLabel')}</label>
                <Input
                  className="figma-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="figma-form-group">
                <label>{t('emailLabel')}</label>
                <Input
                  type="email"
                  className="figma-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="figma-form-group">
                <label>{t('phoneLabel')}</label>
                <Input
                  type="tel"
                  className="figma-input"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="ui-dialog__actions">
                <Button type="button" className="ui-button--secondary" onClick={() => setIsEditing(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={saving} className="figma-btn-primary" style={{ width: 'auto' }}>
                  {saving ? t('loading') : t('save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

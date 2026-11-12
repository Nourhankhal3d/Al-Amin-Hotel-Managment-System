import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthSession, setAuthSession, clearAuthSession } from '../../../core/auth/authManager';
import { ROUTES } from '../../../core/constants/routes';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { useToast } from '../../../components/ui/ToastContext';
import { logoutRequest } from '../../auth/services/auth.api';

import { SubManagerProfileHeader } from '../components/SubManagerProfileHeader';
import { SubManagerProfileStats } from '../components/SubManagerProfileStats';
import { SubManagerAccountInfo } from '../components/SubManagerAccountInfo';
import { SubManagerProfileActions } from '../components/SubManagerProfileActions';
import { SubManagerEditDrawer, type SubManagerEditData } from '../components/SubManagerEditDrawer';
import { SubManagerPasswordDrawer } from '../components/SubManagerPasswordDrawer';

import './SubManagerProfilePage.css';

const DEFAULT_ROLE_NAMES = new Set([
  'مدير الفندق',
  'المدير الفرعي',
  'حساب المدير الفرعي',
  'Sub-Manager',
  'Sub-Manager Account',
]);

function isDefaultRoleName(value?: string | null): boolean {
  return !value || DEFAULT_ROLE_NAMES.has(value.trim());
}

export function SubManagerProfilePage(): React.ReactElement {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  // Keep user-edited name separate from localized default role titles
  const [customName, setCustomName] = useState<string | null>(() => {
    const session = getAuthSession();
    return session?.staffName && !isDefaultRoleName(session.staffName)
      ? session.staffName
      : null;
  });

  const [email, setEmail] = useState('manager@alaminhotel.com');
  const [phone, setPhone] = useState('+20 100 000 0000');

  // Drawer states
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [passwordDrawerOpen, setPasswordDrawerOpen] = useState(false);

  const editInitialData = useMemo<SubManagerEditData>(
    () => ({
      name: customName ?? (language === 'ar' ? 'المدير الفرعي' : 'Sub-Manager'),
      email,
      phone,
    }),
    [customName, email, phone, language],
  );

  function handleNotifications() {
    navigate('/sub-manager/settings?section=notifications');
  }

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // Local logout proceeds even if network request fails
    }
    clearAuthSession();
    navigate(ROUTES.login, { replace: true });
  }

  async function handleSaveProfile(data: SubManagerEditData) {
    // Artificial small delay for realistic smooth interaction
    await new Promise((resolve) => setTimeout(resolve, 300));
    const cleanName = data.name.trim();
    const nextCustomName = isDefaultRoleName(cleanName) ? null : cleanName;

    setCustomName(nextCustomName);
    setEmail(data.email.trim());
    setPhone(data.phone.trim());

    const currentSession = getAuthSession();
    if (currentSession) {
      setAuthSession({
        ...currentSession,
        staffName: nextCustomName ?? 'المدير الفرعي',
      });
      window.dispatchEvent(new Event('al-amin-session-updated'));
    }

    showToast(t('submanager.profile.editDrawer.successToast'), 'success');
  }

  async function handleChangePassword(passwords: { current: string; next: string }) {
    void passwords;
    await new Promise((resolve) => setTimeout(resolve, 400));
    showToast(t('submanager.profile.passwordDrawer.successToast'), 'success');
  }

  return (
    <div className="submanager-profile-page">
      <SubManagerProfileHeader
        onEdit={() => setEditDrawerOpen(true)}
        onNotifications={handleNotifications}
        name={customName ?? undefined}
      />

      <SubManagerProfileStats />

      <SubManagerAccountInfo
        name={customName ?? undefined}
        email={email}
        phone={phone}
      />

      <SubManagerProfileActions
        onLogout={handleLogout}
        onNotifications={handleNotifications}
        onChangePassword={() => setPasswordDrawerOpen(true)}
      />

      <SubManagerEditDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        onSave={handleSaveProfile}
        initialData={editInitialData}
      />

      <SubManagerPasswordDrawer
        open={passwordDrawerOpen}
        onClose={() => setPasswordDrawerOpen(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Drawer } from '../../../components/ui/Drawer';
import { useLanguage } from '../../../core/i18n/useLanguage';
import './SubManagerEditDrawer.css';

export interface SubManagerPasswordDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (passwords: { current: string; next: string }) => Promise<void> | void;
}

export function SubManagerPasswordDrawer({
  open,
  onClose,
  onSubmit,
}: SubManagerPasswordDrawerProps): React.ReactElement {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    current?: string;
    next?: string;
    confirm?: string;
  }>({});

  useEffect(() => {
    if (open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setErrors({});
      setLoading(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: { current?: string; next?: string; confirm?: string } = {};

    if (!currentPassword) {
      newErrors.current = t('submanager.profile.passwordDrawer.errCurrentRequired');
    }

    if (!newPassword) {
      newErrors.next = t('submanager.profile.passwordDrawer.errNewRequired');
    } else if (newPassword.length < 6) {
      newErrors.next = t('submanager.profile.passwordDrawer.errNewLength');
    }

    if (!confirmPassword) {
      newErrors.confirm = t('submanager.profile.passwordDrawer.errConfirmMismatch');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm = t('submanager.profile.passwordDrawer.errConfirmMismatch');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await onSubmit({ current: currentPassword, next: newPassword });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <div className="submanager-drawer-footer">
      <button
        type="button"
        className="submanager-drawer-footer__btn-cancel"
        onClick={onClose}
        disabled={loading}
      >
        {t('submanager.profile.passwordDrawer.cancel')}
      </button>
      <button
        type="submit"
        form="submanager-change-password-form"
        className="submanager-drawer-footer__btn-submit"
        disabled={loading}
      >
        {loading ? t('loading') : t('submanager.profile.passwordDrawer.submit')}
      </button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('submanager.profile.passwordDrawer.title')}
      footer={footer}
    >
      <form
        id="submanager-change-password-form"
        className="submanager-drawer-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="submanager-drawer-form__group">
          <label htmlFor="submanager-current-password">
            {t('submanager.profile.passwordDrawer.currentPasswordLabel')}
          </label>
          <div className="submanager-drawer-form__password-wrap">
            <input
              id="submanager-current-password"
              type={showCurrent ? 'text' : 'password'}
              className="submanager-drawer-form__input"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errors.current) setErrors((prev) => ({ ...prev, current: undefined }));
              }}
              disabled={loading}
              autoFocus
            />
            <button
              type="button"
              className="submanager-drawer-form__eye-btn"
              onClick={() => setShowCurrent(!showCurrent)}
              aria-label="Toggle password visibility"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.current && (
            <span className="submanager-drawer-form__field-error">{errors.current}</span>
          )}
        </div>

        <div className="submanager-drawer-form__group">
          <label htmlFor="submanager-new-password">
            {t('submanager.profile.passwordDrawer.newPasswordLabel')}
          </label>
          <div className="submanager-drawer-form__password-wrap">
            <input
              id="submanager-new-password"
              type={showNew ? 'text' : 'password'}
              className="submanager-drawer-form__input"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.next) setErrors((prev) => ({ ...prev, next: undefined }));
              }}
              disabled={loading}
            />
            <button
              type="button"
              className="submanager-drawer-form__eye-btn"
              onClick={() => setShowNew(!showNew)}
              aria-label="Toggle password visibility"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.next && (
            <span className="submanager-drawer-form__field-error">{errors.next}</span>
          )}
        </div>

        <div className="submanager-drawer-form__group">
          <label htmlFor="submanager-confirm-password">
            {t('submanager.profile.passwordDrawer.confirmPasswordLabel')}
          </label>
          <div className="submanager-drawer-form__password-wrap">
            <input
              id="submanager-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              className="submanager-drawer-form__input"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              disabled={loading}
            />
            <button
              type="button"
              className="submanager-drawer-form__eye-btn"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label="Toggle password visibility"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm && (
            <span className="submanager-drawer-form__field-error">{errors.confirm}</span>
          )}
        </div>
      </form>
    </Drawer>
  );
}

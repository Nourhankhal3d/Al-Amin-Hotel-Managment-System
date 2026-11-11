import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { useLanguage } from '../../../core/i18n/useLanguage';
import './SubManagerEditDrawer.css';

export interface SubManagerEditData {
  name: string;
  email: string;
  phone: string;
}

export interface SubManagerEditDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SubManagerEditData) => Promise<void> | void;
  initialData: SubManagerEditData;
}

export function SubManagerEditDrawer({
  open,
  onClose,
  onSave,
  initialData,
}: SubManagerEditDrawerProps): React.ReactElement {
  const { t, dir } = useLanguage();
  const [name, setName] = useState(initialData.name);
  const [email, setEmail] = useState(initialData.email);
  const [phone, setPhone] = useState(initialData.phone);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setName(initialData.name);
      setEmail(initialData.email);
      setPhone(initialData.phone);
      setErrors({});
      setLoading(false);
    }
    wasOpenRef.current = open;
  }, [open, initialData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!cleanName) {
      newErrors.name = t('submanager.profile.editDrawer.errNameRequired');
    }

    if (!cleanEmail) {
      newErrors.email = t('submanager.profile.editDrawer.errEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = t('submanager.profile.editDrawer.errEmailInvalid');
    }

    if (!cleanPhone) {
      newErrors.phone = t('submanager.profile.editDrawer.errPhoneRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await onSave({ name: cleanName, email: cleanEmail, phone: cleanPhone });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const footer = (
    <div className="submanager-drawer-footer" dir={dir}>
      <button
        type="button"
        className="submanager-drawer-footer__btn-cancel"
        onClick={onClose}
        disabled={loading}
      >
        {t('submanager.profile.editDrawer.cancel')}
      </button>
      <button
        type="submit"
        form="submanager-edit-profile-form"
        className="submanager-drawer-footer__btn-submit"
        disabled={loading}
      >
        {loading ? t('loading') : t('submanager.profile.editDrawer.save')}
      </button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('submanager.profile.editDrawer.title')}
      closeLabel={t('submanager.profile.editDrawer.cancel')}
      side="start"
      className="submanager-edit-drawer"
      footer={footer}
    >
      <form
        id="submanager-edit-profile-form"
        className="submanager-drawer-form"
        dir={dir}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="submanager-drawer-form__group">
          <label htmlFor="submanager-edit-name">
            {t('submanager.profile.editDrawer.nameLabel')}
          </label>
          <input
            id="submanager-edit-name"
            type="text"
            className="submanager-drawer-form__input"
            placeholder={t('submanager.profile.editDrawer.namePlaceholder')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            disabled={loading}
            autoFocus
          />
          {errors.name && (
            <span className="submanager-drawer-form__field-error">{errors.name}</span>
          )}
        </div>

        <div className="submanager-drawer-form__group">
          <label htmlFor="submanager-edit-email">
            {t('submanager.profile.editDrawer.emailLabel')}
          </label>
          <input
            id="submanager-edit-email"
            type="email"
            className="submanager-drawer-form__input"
            placeholder={t('submanager.profile.editDrawer.emailPlaceholder')}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            disabled={loading}
          />
          {errors.email && (
            <span className="submanager-drawer-form__field-error">{errors.email}</span>
          )}
        </div>

        <div className="submanager-drawer-form__group">
          <label htmlFor="submanager-edit-phone">
            {t('submanager.profile.editDrawer.phoneLabel')}
          </label>
          <input
            id="submanager-edit-phone"
            type="tel"
            className="submanager-drawer-form__input"
            placeholder={t('submanager.profile.editDrawer.phonePlaceholder')}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            disabled={loading}
            dir="ltr"
          />
          {errors.phone && (
            <span className="submanager-drawer-form__field-error">{errors.phone}</span>
          )}
        </div>
      </form>
    </Drawer>
  );
}

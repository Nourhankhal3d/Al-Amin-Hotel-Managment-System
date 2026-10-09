import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { validateLogin, type LoginValidationErrors } from '../schemas/login.schema';
import { login } from '../services/auth.api';
import { setAuthSession } from '../../../core/auth/authManager';
import { ROUTES } from '../../../core/constants/routes';
import { useLanguage } from '../../../core/i18n/useLanguage';

import { EyeIcon, EyeOffIcon } from '../../../components/common/EyeIcons';

export function LoginPage() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);

    const input = { email, password };
    const validationErrors = validateLogin(input, t);

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await login(input);
      setAuthSession({
        token: response.token,
        role: response.role,
        userId: response.userId,
      });
      navigate(ROUTES.dashboard, { replace: true });
    } catch {
      // User-friendly localized connection error alert
      setApiError(t('errServerConnection'));
    } finally {
      setLoading(false);
    }
  }

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
  }

  return (
    <div className="figma-auth-container">
      <div className="figma-auth-card">
        {/* Top Card Controls: Language Switcher */}
        <div className="figma-auth-top-bar">
          <button
            type="button"
            className="figma-lang-switcher"
            onClick={toggleLanguage}
            aria-label="Switch Language"
          >
            🌐 {language === 'ar' ? 'EN' : 'العربية'}
          </button>
        </div>

        {/* Brand Header */}
        <div className="figma-auth-header">
          <div className="figma-auth-logo">
            <img src="/assets/logo.jpg" alt="Al-Amin Logo" />
          </div>
          <h1 className="figma-auth-title">{t('loginTitle')}</h1>
          <p className="figma-auth-subtitle">{t('loginSubtitle')}</p>
        </div>

        {apiError && <div className="figma-alert figma-alert--error">{apiError}</div>}

        <form className="figma-auth-form" onSubmit={handleSubmit} noValidate>
          <div className="figma-form-group">
            <label htmlFor="login-email">{t('emailLabel')}</label>
            <Input
              id="login-email"
              name="email"
              type="email"
              className="figma-input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder={t('emailPlaceholder')}
              disabled={loading}
            />
            {errors.email && <span className="figma-field-error">{errors.email}</span>}
          </div>

          <div className="figma-form-group">
            <div className="figma-label-row">
              <label htmlFor="login-password">{t('passwordLabel')}</label>
              <button
                type="button"
                className="figma-link-btn"
                onClick={() => {
                  setForgotSent(false);
                  setForgotEmail(email);
                  setShowForgotModal(true);
                }}
              >
                {t('forgotPassword')}
              </button>
            </div>
            <div className="figma-password-wrap">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="figma-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder={t('passwordPlaceholder')}
                disabled={loading}
              />
              <button
                type="button"
                className="figma-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && <span className="figma-field-error">{errors.password}</span>}
          </div>

          <Button type="submit" disabled={loading} className="figma-btn-primary">
            {loading ? t('loading') : t('login')}
          </Button>

          <div className="figma-auth-footer">
            <span>{t('noAccountYet')}</span>{' '}
            <Link to={ROUTES.register} className="figma-nav-link">
              {t('registerTitle')}
            </Link>
          </div>
        </form>

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="ui-drawer-backdrop" onClick={() => setShowForgotModal(false)}>
            <div className="ui-dialog figma-dialog" onClick={(e) => e.stopPropagation()}>
              <h2>{t('forgotPasswordTitle')}</h2>
              {!forgotSent ? (
                <form onSubmit={handleForgotSubmit} className="figma-auth-form" style={{ marginTop: 12 }}>
                  <p className="figma-dialog-desc">{t('forgotPasswordDesc')}</p>
                  <Input
                    type="email"
                    className="figma-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                  <div className="ui-dialog__actions">
                    <Button type="button" className="ui-button--secondary" onClick={() => setShowForgotModal(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit" className="figma-btn-primary" style={{ width: 'auto' }}>
                      إرسال
                    </Button>
                  </div>
                </form>
              ) : (
                <div>
                  <p className="figma-alert figma-alert--success">{t('forgotPasswordSuccess')}</p>
                  <div className="ui-dialog__actions">
                    <Button type="button" className="figma-btn-primary" style={{ width: 'auto' }} onClick={() => setShowForgotModal(false)}>
                      {t('back')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

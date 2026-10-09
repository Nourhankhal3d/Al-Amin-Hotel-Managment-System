import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { validateRegister, calculatePasswordStrength, type RegisterValidationErrors } from '../schemas/register.schema';
import { register } from '../services/auth.api';
import { setAuthSession } from '../../../core/auth/authManager';
import { ROUTES } from '../../../core/constants/routes';
import { ROLES } from '../../../core/constants/roles';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { EyeIcon, EyeOffIcon } from '../../../components/common/EyeIcons';

export function RegisterPage() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const strength = calculatePasswordStrength(password);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);

    const input = { fullName, email, phone, role: ROLES.receptionist, password, confirmPassword };
    const validationErrors = validateRegister(input, t);

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await register(input);
      setAuthSession({
        token: response.token,
        role: response.role,
        userId: response.userId,
      });
      navigate(ROUTES.dashboard, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error && err.message !== 'Failed request' ? err.message : t('errServerConnection');
      setApiError(message);
    } finally {
      setLoading(false);
    }
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
          <h1 className="figma-auth-title">{t('registerTitle')}</h1>
          <p className="figma-auth-subtitle">{t('registerSubtitle')}</p>
        </div>

        {apiError && <div className="figma-alert figma-alert--error">{apiError}</div>}

        <form className="figma-auth-form" onSubmit={handleSubmit} noValidate>
          <div className="figma-form-group">
            <label htmlFor="reg-name">{t('fullNameLabel')}</label>
            <Input
              id="reg-name"
              name="fullName"
              type="text"
              className="figma-input"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              placeholder={t('fullNamePlaceholder')}
              disabled={loading}
            />
            {errors.fullName && <span className="figma-field-error">{errors.fullName}</span>}
          </div>

          <div className="figma-form-group">
            <label htmlFor="reg-email">{t('emailLabel')}</label>
            <Input
              id="reg-email"
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
            <label htmlFor="reg-phone">{t('phoneLabel')}</label>
            <Input
              id="reg-phone"
              name="phone"
              type="tel"
              className="figma-input"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              placeholder={t('phonePlaceholder')}
              disabled={loading}
            />
            {errors.phone && <span className="figma-field-error">{errors.phone}</span>}
          </div>

          <div className="figma-form-group">
            <label htmlFor="reg-password">{t('passwordLabel')}</label>
            <div className="figma-password-wrap">
              <Input
                id="reg-password"
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

            {password && (
              <div className="password-strength-wrap">
                <div className="password-strength-label">
                  <span>{t('passwordStrength')}:</span>
                  <strong className={`strength-text strength-text--${strength}`}>{t(strength)}</strong>
                </div>
                <div className="password-strength-meter">
                  <div className={`meter-bar meter-bar--${strength}`} />
                </div>
              </div>
            )}
          </div>

          <div className="figma-form-group">
            <label htmlFor="reg-confirm">{t('confirmPasswordLabel')}</label>
            <Input
              id="reg-confirm"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              className="figma-input"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder={t('confirmPasswordPlaceholder')}
              disabled={loading}
            />
            {errors.confirmPassword && <span className="figma-field-error">{errors.confirmPassword}</span>}
          </div>

          <Button type="submit" disabled={loading} className="figma-btn-primary">
            {loading ? t('loading') : t('register')}
          </Button>

          <div className="figma-auth-footer">
            <span>{t('alreadyHaveAccount')}</span>{' '}
            <Link to={ROUTES.login} className="figma-nav-link">
              {t('login')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

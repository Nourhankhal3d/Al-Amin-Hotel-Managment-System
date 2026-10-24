import { Eye, EyeOff, Globe } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import logoUrl from '../../../assets/images/al-amin-logo.png';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { setAccessToken } from '../../../core/api/apiClient';
import { ROLES } from '../../../core/constants/roles';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { getAuthSession, setAuthSession } from '../../../core/auth/authManager';
import { ROUTES } from '../../../core/constants/routes';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { validateLogin, type LoginValidationErrors } from '../schemas/login.schema';
import { login } from '../services/auth.api';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    if (getAuthSession()) {
      navigate(ROUTES.dashboard, { replace: true });
    }
  }, [navigate]);

  const modeParam = searchParams.get('mode');
  const [isRecovery, setIsRecovery] = useState<boolean>(() => {
    if (modeParam === 'login') return false;
    return true;
  });

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<LoginValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Recovery form state
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [recoveryErrors, setRecoveryErrors] = useState<{ username?: string; employeeId?: string }>({});
  const [recoverySubmitted, setRecoverySubmitted] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);

    const input = { username, password };
    const validationErrors = validateLogin(input, t);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const response = await login(input);
      setAccessToken(response.access_token);
      setAuthSession({
        role: ROLES.receptionist,
        userId: String(response.staff.staff_id),
        staffName: response.staff.name,
        readOnly: response.read_only,
      });
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      setApiError(getErrorMessage(error, language));
    } finally {
      setLoading(false);
    }
  }

  function handleRecoverySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const newErrors: { username?: string; employeeId?: string } = {};

    if (!recoveryUsername.trim()) {
      newErrors.username = t('usernameRequired');
    }
    if (!employeeId.trim()) {
      newErrors.employeeId = t('employeeIdRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setRecoveryErrors(newErrors);
      return;
    }

    setRecoveryErrors({});
    setRecoveryLoading(true);
    setTimeout(() => {
      setRecoveryLoading(false);
      setRecoverySubmitted(true);
    }, 400);
  }

  function switchToRecovery() {
    setRecoverySubmitted(false);
    setRecoveryErrors({});
    setIsRecovery(true);
    setSearchParams({ mode: 'recovery' }, { replace: true });
  }

  function switchToLogin() {
    setIsRecovery(false);
    setSearchParams({ mode: 'login' }, { replace: true });
  }

  return (
    <div className="figma-auth-container">
      <div className="figma-auth-card">
        {isRecovery ? (
          <div>
            <div className="figma-auth-header">
              <div className="figma-auth-logo-clean">
                <img src={logoUrl} alt="Al-Amin Hotel" />
              </div>
              <h1 className="figma-auth-title">{t('recoveryTitle')}</h1>
              <p className="figma-auth-subtitle">{t('recoverySubtitle')}</p>
            </div>

            {recoverySubmitted && (
              <div className="figma-alert figma-alert--success">
                {t('recoverySuccess')}
              </div>
            )}

            <form className="figma-auth-form" onSubmit={handleRecoverySubmit} noValidate>
              <div className="figma-form-group">
                <label htmlFor="recovery-username">{t('usernameLabel')}</label>
                <Input
                  id="recovery-username"
                  name="username"
                  type="text"
                  className="figma-input"
                  value={recoveryUsername}
                  onChange={(event) => {
                    setRecoveryUsername(event.target.value);
                    if (recoveryErrors.username) {
                      setRecoveryErrors((previous) => ({ ...previous, username: undefined }));
                    }
                  }}
                  placeholder={t('usernamePlaceholder')}
                  disabled={recoveryLoading}
                />
                {recoveryErrors.username && (
                  <span className="figma-field-error">{recoveryErrors.username}</span>
                )}
              </div>

              <div className="figma-form-group">
                <label htmlFor="recovery-employee-id">{t('employeeIdLabel')}</label>
                <Input
                  id="recovery-employee-id"
                  name="employeeId"
                  type="text"
                  className="figma-input"
                  value={employeeId}
                  onChange={(event) => {
                    setEmployeeId(event.target.value);
                    if (recoveryErrors.employeeId) {
                      setRecoveryErrors((previous) => ({ ...previous, employeeId: undefined }));
                    }
                  }}
                  placeholder={t('employeeIdPlaceholder')}
                  disabled={recoveryLoading}
                />
                {recoveryErrors.employeeId && (
                  <span className="figma-field-error">{recoveryErrors.employeeId}</span>
                )}
              </div>

              <Button type="submit" disabled={recoveryLoading} className="figma-btn-primary">
                {recoveryLoading ? t('loading') : t('sendHelpRequest')}
              </Button>

              <button
                type="button"
                className="figma-auth-back-link"
                onClick={switchToLogin}
              >
                {t('backToLogin')}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="figma-auth-top-bar">
              <button
                type="button"
                className="figma-lang-switcher"
                onClick={toggleLanguage}
                aria-label="Switch Language"
              >
                <Globe aria-hidden="true" /> {language === 'ar' ? 'EN' : 'العربية'}
              </button>
            </div>

            <div className="figma-auth-header">
              <div className="figma-auth-logo-clean">
                <img src={logoUrl} alt="Al-Amin Hotel" />
              </div>
              <h1 className="figma-auth-title">{t('loginTitle')}</h1>
              <p className="figma-auth-subtitle">{t('loginSubtitle')}</p>
            </div>

            {apiError && <div className="figma-alert figma-alert--error">{apiError}</div>}

            <form className="figma-auth-form" onSubmit={handleSubmit} noValidate>
              <div className="figma-form-group">
                <label htmlFor="login-username">{t('usernameLabel')}</label>
                <Input
                  id="login-username"
                  name="username"
                  type="text"
                  className="figma-input"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (errors.username) setErrors((previous) => ({ ...previous, username: undefined }));
                  }}
                  placeholder={t('usernamePlaceholder')}
                  disabled={loading}
                />
                {errors.username && <span className="figma-field-error">{errors.username}</span>}
              </div>

              <div className="figma-form-group">
                <div className="figma-label-row">
                  <label htmlFor="login-password">{t('passwordLabel')}</label>
                  <button
                    type="button"
                    className="figma-link-btn"
                    onClick={switchToRecovery}
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
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (errors.password) setErrors((previous) => ({ ...previous, password: undefined }));
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
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && <span className="figma-field-error">{errors.password}</span>}
              </div>

              <Button type="submit" disabled={loading} className="figma-btn-primary">
                {loading ? t('loading') : t('login')}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

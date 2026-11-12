import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../../../../core/i18n/useLanguage';
import { getErrorMessage } from '../../../../core/errors/getErrorMessage';
import { requestPasswordReset } from '../../services/auth.api';
import {
  validateForgotPassword,
  type ForgotPasswordValidationErrors,
} from '../../schemas/forgotPassword.schema';
import './ForgotPasswordCard.css';

export interface ForgotPasswordCardProps {
  onBackToLogin: () => void;
  defaultUsername?: string;
}

export function ForgotPasswordCard({
  onBackToLogin,
  defaultUsername = '',
}: ForgotPasswordCardProps): React.ReactElement {
  const { language, t } = useLanguage();
  const [username, setUsername] = useState(defaultUsername);
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ForgotPasswordValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);

    const input = {
      username: username.trim(),
      employeeNumber: employeeNumber.trim(),
    };

    const validationErrors = validateForgotPassword(input, t);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // NOTE: The current backend PasswordResetRequest model & API contract accept `username`.
      // The `employeeNumber` field is validated client-side and flagged for backend schema confirmation.
      await requestPasswordReset(input.username);
      setIsSuccess(true);
    } catch (error) {
      setApiError(getErrorMessage(error, language));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-password-card">
      <div className="forgot-password-card__header">
        <div className="forgot-password-card__logo">
          <img src="/hotel-logo.png" alt="Al-Amin Hotel Logo" />
        </div>
        <h1 className="forgot-password-card__title">
          {t('submanager.login.forgot.title')}
        </h1>
        <p className="forgot-password-card__subtitle">
          {t('submanager.login.forgot.subtitle')}
        </p>
      </div>

      {apiError && (
        <div className="figma-alert figma-alert--error" role="alert">
          {apiError}
        </div>
      )}

      {!isSuccess ? (
        <form className="forgot-password-card__form" onSubmit={handleSubmit} noValidate>
          <div className="forgot-password-card__group">
            <label htmlFor="forgot-username">
              {t('submanager.login.forgot.usernameLabel')}
            </label>
            <input
              id="forgot-username"
              name="username"
              type="text"
              className="forgot-password-card__input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) {
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
              placeholder={t('submanager.login.forgot.usernamePlaceholder')}
              disabled={loading}
              autoFocus
            />
            {errors.username && (
              <span className="forgot-password-card__field-error">{errors.username}</span>
            )}
          </div>

          <div className="forgot-password-card__group">
            <label htmlFor="forgot-employee-number">
              {t('submanager.login.forgot.employeeNumberLabel')}
            </label>
            <input
              id="forgot-employee-number"
              name="employeeNumber"
              type="text"
              className="forgot-password-card__input"
              value={employeeNumber}
              onChange={(e) => {
                setEmployeeNumber(e.target.value);
                if (errors.employeeNumber) {
                  setErrors((prev) => ({ ...prev, employeeNumber: undefined }));
                }
              }}
              placeholder={t('submanager.login.forgot.employeeNumberPlaceholder')}
              disabled={loading}
            />
            {errors.employeeNumber && (
              <span className="forgot-password-card__field-error">
                {errors.employeeNumber}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="forgot-password-card__submit-btn"
            disabled={loading}
          >
            {loading ? t('loading') : t('submanager.login.forgot.submitButton')}
          </button>

          <div className="forgot-password-card__back-wrap">
            <button
              type="button"
              className="forgot-password-card__back-link"
              onClick={onBackToLogin}
              disabled={loading}
            >
              {t('submanager.login.forgot.backToLogin')}
            </button>
          </div>
        </form>
      ) : (
        <div className="forgot-password-card__success-view">
          <div className="forgot-password-card__success-box">
            <div className="forgot-password-card__success-icon-wrap" aria-hidden="true">
              <Check className="forgot-password-card__success-icon" strokeWidth={2.5} />
            </div>
            <strong className="forgot-password-card__success-title">
              {t('submanager.login.forgot.successTitle')}
            </strong>
            <span className="forgot-password-card__success-desc">
              {t('submanager.login.forgot.successSubtitle')}
            </span>
          </div>

          <button
            type="button"
            className="forgot-password-card__submit-btn"
            onClick={onBackToLogin}
          >
            {t('submanager.login.forgot.successAction')}
          </button>
        </div>
      )}
    </div>
  );
}


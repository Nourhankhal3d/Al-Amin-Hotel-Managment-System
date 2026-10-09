import type { RegisterCredentials, PasswordStrength } from '../types/auth.types';

export interface RegisterValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) return 'weak';
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}

export function validateRegister(
  input: RegisterCredentials,
  t: (key: string) => string,
): RegisterValidationErrors | null {
  const errors: RegisterValidationErrors = {};

  const trimmedName = input.fullName.trim();
  if (!trimmedName) {
    errors.fullName = t('errFullNameRequired');
  } else if (trimmedName.length < 3) {
    errors.fullName = t('errFullNameMinLength');
  }

  const trimmedEmail = input.email.trim();
  if (!trimmedEmail) {
    errors.email = t('errEmailRequired');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = t('errEmailInvalid');
  }

  const trimmedPhone = input.phone.trim();
  if (!trimmedPhone) {
    errors.phone = t('errPhoneRequired');
  } else if (!/^\+?[0-9\s-]{8,15}$/.test(trimmedPhone)) {
    errors.phone = t('errPhoneInvalid');
  }

  if (!input.password) {
    errors.password = t('errPasswordRequired');
  } else if (input.password.length < 8) {
    errors.password = t('errPasswordMinLength');
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = t('errConfirmPasswordRequired');
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = t('errPasswordMismatch');
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

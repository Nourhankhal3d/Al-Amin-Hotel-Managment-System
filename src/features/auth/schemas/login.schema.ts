import type { LoginCredentials } from '../types/auth.types';

export interface LoginValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function validateLogin(
  input: LoginCredentials,
  t: (key: string) => string,
): LoginValidationErrors | null {
  const errors: LoginValidationErrors = {};
  const trimmedEmail = input.email.trim();

  if (!trimmedEmail) {
    errors.email = t('errEmailRequired');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = t('errEmailInvalid');
  }

  if (!input.password) {
    errors.password = t('errPasswordRequired');
  } else if (input.password.length < 6) {
    errors.password = t('errPasswordMinLength');
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

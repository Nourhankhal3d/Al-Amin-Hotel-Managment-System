export interface ForgotPasswordInput {
  username: string;
  employeeNumber: string;
}

export interface ForgotPasswordValidationErrors {
  username?: string;
  employeeNumber?: string;
}

export function validateForgotPassword(
  input: ForgotPasswordInput,
  t: (key: string) => string,
): ForgotPasswordValidationErrors | null {
  const errors: ForgotPasswordValidationErrors = {};

  if (!input.username.trim()) {
    errors.username = t('submanager.login.forgot.errUsernameRequired') || 'اسم المستخدم مطلوب';
  }

  if (!input.employeeNumber.trim()) {
    errors.employeeNumber = t('submanager.login.forgot.errEmployeeNumberRequired') || 'رقم الموظف مطلوب';
  }

  return Object.keys(errors).length > 0 ? errors : null;
}


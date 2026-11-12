import { ApiError } from '../../../core/api/apiError';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import type { Language } from '../../../core/i18n';

/** Contract error codes this page explains in its own words */
const KNOWN_ERRORS = ['INVALID_STATUS_TRANSITION', 'NOT_FOUND', 'VALIDATION_ERROR'] as const;

export function apiErrorText(error: unknown, t: (key: string) => string, language: Language): string {
  if (error instanceof ApiError && (KNOWN_ERRORS as readonly string[]).includes(error.code)) {
    return t(`apiErrors.${error.code}`);
  }
  return getErrorMessage(error, language);
}

/** Adding a task: the API answers 404 while POST /manager/housekeeping-tasks is not built yet */
export function createErrorText(error: unknown, t: (key: string) => string, language: Language): string {
  if (error instanceof ApiError && error.statusCode === 404) return t('apiErrors.createUnavailable');
  return apiErrorText(error, t, language);
}

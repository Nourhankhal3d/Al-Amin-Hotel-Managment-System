import { ApiError } from '../../../core/api/apiError';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import type { Language } from '../../../core/i18n';

/**
 * The manager maintenance endpoints are not on the server yet (not in Manager API Contract v1.2),
 * so a 404 there means "not available yet" rather than "ticket not found".
 */
export function apiErrorText(error: unknown, t: (key: string) => string, language: Language): string {
  if (error instanceof ApiError && error.statusCode === 404) return t('apiErrors.notAvailable');
  if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') return t('apiErrors.VALIDATION_ERROR');
  return getErrorMessage(error, language);
}

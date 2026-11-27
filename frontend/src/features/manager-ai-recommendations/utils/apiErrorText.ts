import { ApiError } from '../../../core/api/apiError';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import type { Language } from '../../../core/i18n';

/** Error codes this page explains in its own words; anything else gets the app's general message */
// AI_UNAVAILABLE: the AI service did not answer (the saved recommendations stay on the page)
const KNOWN_ERRORS = ['AI_UNAVAILABLE', 'NOT_FOUND', 'VALIDATION_ERROR'] as const;

export function apiErrorText(error: unknown, t: (key: string) => string, language: Language): string {
  if (error instanceof ApiError && (KNOWN_ERRORS as readonly string[]).includes(error.code)) {
    return t(`apiErrors.${error.code}`);
  }
  return getErrorMessage(error, language);
}

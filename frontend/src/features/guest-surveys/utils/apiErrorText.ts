import { ApiError } from '../../../core/api/apiError';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import type { Language } from '../../../core/i18n';

/** Error codes this page explains in its own words; anything else gets the app's general message */
// CONFLICT: the guest already has a survey; NOT_FOUND: the stay is no longer in the departing list
const KNOWN_ERRORS = ['CONFLICT', 'NOT_FOUND', 'VALIDATION_ERROR'] as const;

export function apiErrorText(error: unknown, t: (key: string) => string, language: Language): string {
  if (error instanceof ApiError && (KNOWN_ERRORS as readonly string[]).includes(error.code)) {
    return t(`apiErrors.${error.code}`);
  }
  return getErrorMessage(error, language);
}

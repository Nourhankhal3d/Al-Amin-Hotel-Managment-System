import { ApiError } from '../../../core/api/apiError';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import type { Language } from '../../../core/i18n';

/** Contract error codes this page explains in its own words (Manager API Contract v1.2, section 2) */
// CONFLICT on an approval: nothing left to refund on the booking, or no open front-desk shift to record the refund in
const KNOWN_ERRORS = ['RECORD_ALREADY_DECIDED', 'CANNOT_APPROVE_OWN_REQUEST', 'NOT_FOUND', 'VALIDATION_ERROR', 'CONFLICT'] as const;

export function apiErrorText(error: unknown, t: (key: string) => string, language: Language): string {
  if (error instanceof ApiError && (KNOWN_ERRORS as readonly string[]).includes(error.code)) {
    return t(`apiErrors.${error.code}`);
  }
  return getErrorMessage(error, language);
}

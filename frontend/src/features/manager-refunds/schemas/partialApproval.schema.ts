import { NOTES_MAX_LENGTH } from '../constants/refunds.constants';
import { parseAmount } from '../utils/refundsDisplay';

/** Values are i18n keys under manager.refunds.errors */
export function validatePartialAmount(text: string, requestedAmount: number, netPaidAmount: number): string | null {
  if (!text.trim()) return 'amountRequired';
  const amount = parseAmount(text);
  if (!Number.isFinite(amount)) return 'amountInvalid';
  if (amount <= 0) return 'amountPositive';
  // A partial approval gives back less than what the guest asked for; the full amount is "full approval"
  if (amount >= requestedAmount) return 'amountTooHigh';
  // Contract: 0 <= approved_refund_amount <= net_paid_amount
  if (amount > netPaidAmount) return 'amountOverPaid';
  // Contract: at most 2 decimal places
  if (Math.round(amount * 100) !== amount * 100) return 'amountDecimals';
  return null;
}

/** Contract: manager_comment up to 500 characters, and required when rejecting */
export function validateNotes(text: string, rejecting = false): string | null {
  if (rejecting && !text.trim()) return 'commentRequired';
  return text.trim().length > NOTES_MAX_LENGTH ? 'notesTooLong' : null;
}

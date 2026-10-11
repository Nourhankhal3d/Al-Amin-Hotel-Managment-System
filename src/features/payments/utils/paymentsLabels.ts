import { PAYMENT_METHODS } from '../../../core/constants/paymentMethods';
import { STATUS } from '../../../core/constants/status';

/** Badge tone shared by status / method pills on the payments page. */
export type PaymentsBadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function statusTone(status: string): PaymentsBadgeTone {
  switch (status) {
    case STATUS.completed:
      return 'success';
    case STATUS.pending:
      return 'warning';
    case STATUS.inProgress:
      return 'info';
    case STATUS.cancelled:
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Arabic display labels for the (English) status values coming from the API. */
export function statusLabel(status: string): string {
  switch (status) {
    case STATUS.completed:
      return 'مكتملة';
    case STATUS.pending:
      return 'معلقة';
    case STATUS.inProgress:
      return 'قيد التنفيذ';
    case STATUS.cancelled:
      return 'ملغاة';
    default:
      return status;
  }
}

export function methodLabel(method: string): string {
  switch (method) {
    case PAYMENT_METHODS.cash:
      return 'نقدي';
    case PAYMENT_METHODS.card:
      return 'بطاقة إلكترونية';
    case PAYMENT_METHODS.transfer:
      return 'حوالة بنكية';
    default:
      return method;
  }
}

export function methodTone(method: string): PaymentsBadgeTone {
  switch (method) {
    case PAYMENT_METHODS.transfer:
      return 'warning';
    case PAYMENT_METHODS.card:
    case PAYMENT_METHODS.cash:
      return 'success';
    default:
      return 'neutral';
  }
}

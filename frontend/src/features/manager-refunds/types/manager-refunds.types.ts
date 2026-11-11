// Names follow Manager API Contract v1.2, section 8 (Approvals & Cancellation Refund Settlements).
// The refunds page shows the approvals whose request_type is REFUND or CANCELLATION.

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApprovalRequestType = 'REFUND' | 'DISCOUNT' | 'UPGRADE' | 'CANCELLATION' | 'PRICE_OVERRIDE';
export type RefundRequestType = Extract<ApprovalRequestType, 'REFUND' | 'CANCELLATION'>;
/** Not an API field: FULL when the guest asks for everything that was paid, PARTIAL otherwise */
export type RefundType = 'FULL' | 'PARTIAL';
export type ApprovalAction = 'APPROVE' | 'REJECT';

/** GET /manager/approvals item, as the contract names it */
export interface ApiApproval {
  approval_id: string;
  booking_id: string | null;
  request_type: ApprovalRequestType;
  status: ApprovalStatus;
  requested_by_staff_id?: string | null;
  requested_by_name?: string | null;
  reason?: string;
  requested_refund_amount?: number;
  net_paid_amount: number;
  approved_refund_amount?: number;
  retained_amount?: number;
  manager_comment?: string | null;
  decided_by_staff_id?: string | null;
  decided_at?: string | null;
  created_at?: string;
  reservation?: {
    guest_name: string | null;
    room_number: string | null;
    check_in?: string | null;
    check_out?: string | null;
  } | null;
  /** Not in contract (the design shows it); the contract says IDs are masked, e.g. ******4567 */
  national_id?: string | null;
}

/** Request as the page uses it */
export interface RefundRequest {
  id: string;
  /** Short label for people, e.g. RF-0128 (the API id is an ObjectId) */
  code: string;
  bookingId: string | null;
  requestType: RefundRequestType;
  roomNumber: string;
  guestName: string;
  nationalId: string | null;
  /** net_paid_amount */
  originalAmount: number;
  /** requested_refund_amount */
  requestedAmount: number;
  refundType: RefundType;
  reason: string;
  status: ApprovalStatus;
  requestedAt: string | null;
  requestedByName: string | null;
  approvedAmount: number | null;
  retainedAmount: number | null;
  managerNotes: string | null;
  decidedAt: string | null;
}

/** PATCH /manager/approvals/{id}/decision body (Idempotency-Key header required) */
export interface ApprovalDecisionBody {
  action: ApprovalAction;
  /** 0 <= amount <= net_paid_amount; required when approving a REFUND or CANCELLATION */
  approved_refund_amount?: number;
  /** Required when rejecting, up to 500 characters */
  manager_comment?: string;
}

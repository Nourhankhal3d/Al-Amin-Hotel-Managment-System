import { request } from '../../../core/api/apiClient';
import type { ApiApproval, ApprovalDecisionBody, RefundRequest, RefundRequestType } from '../types/manager-refunds.types';

// Manager API Contract v1.2, section 8 (mounted under /manager like the other manager routes)
const BASE = '/manager/approvals';
const REFUND_TYPES: RefundRequestType[] = ['REFUND', 'CANCELLATION'];

export function isRefundApproval(api: ApiApproval): boolean {
  return (REFUND_TYPES as string[]).includes(api.request_type);
}

export function toRefundRequest(api: ApiApproval): RefundRequest {
  const id = String(api.approval_id);
  const original = Number(api.net_paid_amount) || 0;
  const requested = Number(api.requested_refund_amount ?? original) || 0;
  const decided = api.status === 'APPROVED';
  return {
    id,
    code: `RF-${id.slice(-4).toUpperCase()}`,
    bookingId: api.booking_id ?? null,
    requestType: api.request_type === 'CANCELLATION' ? 'CANCELLATION' : 'REFUND',
    roomNumber: String(api.reservation?.room_number ?? ''),
    guestName: api.reservation?.guest_name ?? '—',
    nationalId: api.national_id ?? null,
    originalAmount: original,
    requestedAmount: requested,
    refundType: requested >= original ? 'FULL' : 'PARTIAL',
    reason: api.reason ?? '',
    status: api.status ?? 'PENDING',
    requestedAt: api.created_at ?? null,
    requestedByName: api.requested_by_name ?? null,
    approvedAmount: decided ? Number(api.approved_refund_amount ?? 0) : null,
    retainedAmount: decided ? Number(api.retained_amount ?? 0) : null,
    managerNotes: api.manager_comment ?? null,
    decidedAt: api.decided_at ?? null,
  };
}

/** GET /manager/approvals?status=ALL — the page keeps REFUND and CANCELLATION requests */
export async function getRefundRequests(): Promise<RefundRequest[]> {
  const response = await request<{ data: ApiApproval[] }>(BASE, { params: { status: 'ALL', limit: 100 } });
  return (response.data ?? []).filter(isRefundApproval).map(toRefundRequest);
}

/** PATCH /manager/approvals/{id}/decision — the response is { data: approval } */
export async function decideRefundRequest(id: string, body: ApprovalDecisionBody, idempotencyKey: string): Promise<RefundRequest> {
  const response = await request<{ data: ApiApproval }>(`${BASE}/${encodeURIComponent(id)}/decision`, {
    method: 'PATCH',
    body,
    idempotencyKey,
  });
  return toRefundRequest(response.data);
}

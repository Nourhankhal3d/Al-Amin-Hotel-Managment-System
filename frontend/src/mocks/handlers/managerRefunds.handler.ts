import { http, HttpResponse } from 'msw';

// Mock for the manager refund requests page (Sprint 3).
// Follows Manager API Contract v1.2, section 8: GET /approvals and PATCH /approvals/{id}/decision.
const API = '/api/v1';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type RequestType = 'REFUND' | 'DISCOUNT' | 'UPGRADE' | 'CANCELLATION' | 'PRICE_OVERRIDE';

interface MockApproval {
  approval_id: string;
  booking_id: string | null;
  request_type: RequestType;
  status: Status;
  requested_by_staff_id: string;
  requested_by_name: string;
  reason: string;
  requested_refund_amount: number;
  net_paid_amount: number;
  approved_refund_amount: number;
  retained_amount: number;
  manager_comment: string | null;
  decided_by_staff_id: string | null;
  decided_at: string | null;
  created_at: string;
  reservation: { guest_name: string; room_number: string; check_in: string; check_out: string } | null;
  /** Not in contract; masked as the contract asks */
  national_id: string | null;
}

const STATUSES: Status[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const MONEY_TYPES: RequestType[] = ['CANCELLATION', 'REFUND'];
const RECEPTIONIST = { id: '6719b4a1f2e8c90012ab3408', name: 'كريم نبيل' };
const MANAGER_ID = '6719b4a1f2e8c90012ab3402';

const daysAgo = (days: number, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 3_600_000).toISOString();

function approval(id: string, values: Partial<MockApproval> & Pick<MockApproval, 'request_type' | 'status' | 'net_paid_amount'>): MockApproval {
  return {
    approval_id: id,
    booking_id: `6719b4a1f2e8c90012ab3${id.slice(-3)}`,
    requested_by_staff_id: RECEPTIONIST.id,
    requested_by_name: RECEPTIONIST.name,
    reason: '',
    requested_refund_amount: values.net_paid_amount,
    approved_refund_amount: 0,
    retained_amount: 0,
    manager_comment: null,
    decided_by_staff_id: null,
    decided_at: null,
    created_at: daysAgo(0, 2),
    reservation: null,
    national_id: null,
    ...values,
  };
}

const stay = (guest: string, room: string, nights = 2) => ({
  guest_name: guest,
  room_number: room,
  check_in: daysAgo(-1),
  check_out: daysAgo(-1 - nights),
});

// Seed: RF-0128 (room 301, 7,200 EGP) is the request shared with the finance page
const approvals: MockApproval[] = [
  approval('6719b4a1f2e8c90012ab0128', {
    request_type: 'CANCELLATION', status: 'PENDING', net_paid_amount: 7200, requested_refund_amount: 7200,
    reason: 'إلغاء الحجز قبل الوصول', created_at: daysAgo(0, 2),
    reservation: stay('ضيف الغرفة 301', '301'), national_id: '**********4567',
  }),
  approval('6719b4a1f2e8c90012ab0127', {
    request_type: 'REFUND', status: 'PENDING', net_paid_amount: 5850, requested_refund_amount: 2000,
    reason: 'مغادرة مبكرة قبل انتهاء مدة الحجز بليلة', created_at: daysAgo(1, 3),
    reservation: stay('ضيف الغرفة 208', '208', 3), national_id: '**********4321',
  }),
  approval('6719b4a1f2e8c90012ab0126', {
    request_type: 'REFUND', status: 'APPROVED', net_paid_amount: 4800, requested_refund_amount: 1600,
    approved_refund_amount: 1200, retained_amount: 3600, manager_comment: 'تعويض جزئي عن ليلة واحدة.',
    reason: 'انقطاع المياه الساخنة ليلة كاملة', created_at: daysAgo(3), decided_by_staff_id: MANAGER_ID, decided_at: daysAgo(2, 20),
    reservation: stay('ضيف الغرفة 112', '112'), national_id: '**********2223',
  }),
  approval('6719b4a1f2e8c90012ab0125', {
    request_type: 'CANCELLATION', status: 'REJECTED', net_paid_amount: 3000, requested_refund_amount: 3000,
    manager_comment: 'الإلغاء بعد موعد الوصول حسب سياسة الفندق.', reason: 'إلغاء الحجز يوم الوصول',
    created_at: daysAgo(5), decided_by_staff_id: MANAGER_ID, decided_at: daysAgo(4, 22),
    reservation: stay('ضيف الغرفة 204', '204'), national_id: '**********4000',
  }),
  // Not a refund: the refunds page must not show it
  approval('6719b4a1f2e8c90012ab0124', {
    request_type: 'DISCOUNT', status: 'PENDING', net_paid_amount: 2400, requested_refund_amount: 0,
    reason: 'خصم نزيل دائم', reservation: stay('ضيف الغرفة 110', '110'),
  }),
];

const replies = new Map<string, MockApproval>();

function errorResponse(code: string, message: string, status: number, details?: Record<string, unknown>) {
  return HttpResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/** The decision response has no reservation block (as in the contract example) */
function decisionDto(item: MockApproval) {
  return { ...item, reservation: undefined, national_id: undefined };
}

export const managerRefundsHandlers = [
  http.get(`${API}/manager/approvals`, ({ request }) => {
    const url = new URL(request.url);
    const status = (url.searchParams.get('status') ?? 'PENDING').toUpperCase();
    const type = url.searchParams.get('request_type')?.toUpperCase();
    if (status !== 'ALL' && !STATUSES.includes(status as Status)) return errorResponse('VALIDATION_ERROR', 'Invalid status', 400, { field: 'status' });
    const rows = approvals
      .filter((item) => (status === 'ALL' || item.status === status) && (!type || item.request_type === type))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return HttpResponse.json({ data: rows, meta: { page: 1, limit: 100, total: rows.length, total_pages: 1 } });
  }),

  http.get(`${API}/manager/approvals/:id`, ({ params }) => {
    const found = approvals.find((item) => item.approval_id === params.id);
    return found ? HttpResponse.json({ data: found }) : errorResponse('NOT_FOUND', 'Approval request not found', 404);
  }),

  http.patch(`${API}/manager/approvals/:id/decision`, async ({ params, request }) => {
    const key = request.headers.get('Idempotency-Key');
    if (!key) return errorResponse('VALIDATION_ERROR', 'The Idempotency-Key header is required.', 400);
    const replay = replies.get(key);
    if (replay) return HttpResponse.json({ data: decisionDto(replay) }, { headers: { 'Idempotent-Replayed': 'true' } });

    const found = approvals.find((item) => item.approval_id === params.id);
    if (!found) return errorResponse('NOT_FOUND', 'Approval request not found', 404);
    if (found.status !== 'PENDING') return errorResponse('RECORD_ALREADY_DECIDED', 'This request was already decided.', 409);

    const body = (await request.json().catch(() => ({}))) as { action?: string; approved_refund_amount?: number; manager_comment?: string };
    const action = String(body.action ?? '').toUpperCase();
    if (action !== 'APPROVE' && action !== 'REJECT') {
      return errorResponse('VALIDATION_ERROR', 'action must be APPROVE or REJECT', 400, { field: 'action' });
    }
    const comment = body.manager_comment?.trim() || null;
    if (comment && comment.length > 500) return errorResponse('VALIDATION_ERROR', 'manager_comment must not exceed 500 characters', 400, { field: 'manager_comment' });
    if (action === 'REJECT' && !comment) return errorResponse('VALIDATION_ERROR', 'manager_comment is required when rejecting', 400, { field: 'manager_comment' });

    if (action === 'APPROVE' && MONEY_TYPES.includes(found.request_type)) {
      const amount = Number(body.approved_refund_amount);
      if (body.approved_refund_amount === undefined || !Number.isFinite(amount)) {
        return errorResponse('VALIDATION_ERROR', 'approved_refund_amount is required for this request type', 400, { field: 'approved_refund_amount' });
      }
      if (amount < 0 || amount > found.net_paid_amount) {
        return errorResponse('VALIDATION_ERROR', 'approved_refund_amount must be <= net_paid_amount', 400, { field: 'approved_refund_amount', issue: '<= net_paid_amount' });
      }
      if (Math.round(amount * 100) !== amount * 100) {
        return errorResponse('VALIDATION_ERROR', 'approved_refund_amount must have at most 2 decimal places', 400, { field: 'approved_refund_amount' });
      }
      found.approved_refund_amount = amount;
      found.retained_amount = Math.round((found.net_paid_amount - amount) * 100) / 100;
    }
    found.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    found.manager_comment = comment;
    found.decided_by_staff_id = MANAGER_ID;
    found.decided_at = new Date().toISOString();
    replies.set(key, { ...found });
    return HttpResponse.json({ data: decisionDto(found) });
  }),
];

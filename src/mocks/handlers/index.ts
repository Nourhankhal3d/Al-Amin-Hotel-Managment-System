
import { http, HttpResponse } from 'msw';

const API = '/api/v1';

export const mockHandlers = {
  dashboard: '/dashboard',
  rooms: '/rooms',
  housekeeping: '/cleaning-tasks',
  maintenance: '/maintenance-issues',
  payments: '/payments',
  shiftHandover: '/shifts/current/handover',
  shiftSummary: '/shifts/current/summary',
  shiftReport: '/shifts/:shift_id/report',
} as const;

const now = '2026-10-09T08:00:00+03:00';

const mockShift = {
  shift_id: 41,
  staff_id: 1,
  shift_date: '2026-10-09',
  shift_type: 'morning',
  start_time: '07:00',
  end_time: '16:00',
  status: 'active' as 'active' | 'handed_over',
  handed_over_at: null as string | null,
  shift_notes: null as string | null,
};

const rooms = [
  {
    room_id: 101,
    room_type: 'single',
    status: 'available',
    description: 'Single room',
    price_per_night: 1200,
    half_day_price: 600,
  },
  {
    room_id: 102,
    room_type: 'double',
    status: 'occupied',
    description: 'Double room',
    price_per_night: 1800,
    half_day_price: 900,
  },
  {
    room_id: 103,
    room_type: 'double',
    status: 'cleaning',
    description: 'Double room',
    price_per_night: 1800,
    half_day_price: 900,
  },
];

const cleaningTasks = [
  {
    task_id: 1,
    room_id: 103,
    priority: 'medium',
    status: 'pending',
    notes: 'Clean room after checkout',
    cleaner_name: 'Demo Cleaner',
    assigned_date: now,
    finished_date: null,
    shift_id: 41,
    assigned_by_staff_id: 1,
  },
];

const maintenanceIssues = [
  {
    issue_id: 1,
    room_id: 102,
    problem: 'Air conditioning inspection',
    priority: 'medium',
    status: 'open',
    notes: null,
    created_date: now,
    resolved_date: null,
    shift_id: 41,
    staff_id: 1,
  },
];

const payments = [
  {
    payment_id: 900,
    reservation_id: 55,
    staff_id: 1,
    shift_id: 41,
    amount: 1500,
    payment_method: 'cash',
    notes: 'Demo payment',
    payment_datetime: now,
    payment_verified: false,
    reversal_of_payment_id: null,
  },
];

let shiftNotes: string | null = null;

function paginate<T>(items: T[], request: Request) {
  const url = new URL(request.url);
  const page = Math.max(
    1,
    Number(url.searchParams.get('page')) || 1,
  );
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get('limit')) || 20),
  );
  const start = (page - 1) * limit;

  return {
    data: items.slice(start, start + limit),
    meta: {
      page,
      limit,
      total: items.length,
    },
  };
}

function errorResponse(
  code: string,
  message: string,
  status: number,
) {
  return HttpResponse.json(
    { error: { code, message } },
    { status },
  );
}

function paymentTotals() {
  const cash = payments
    .filter((p) => p.payment_method === 'cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const instapay = payments
    .filter((p) => p.payment_method === 'instapay')
    .reduce((sum, p) => sum + p.amount, 0);

  const vodafoneCash = payments
    .filter((p) => p.payment_method === 'vodafone_cash')
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    cash,
    instapay,
    vodafone_cash: vodafoneCash,
    total: cash + instapay + vodafoneCash,
  };
}

export const handlers = [
  // Development-only mock login. Not real authentication.
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (!body.username?.trim() || !body.password) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Username and password are required.',
        400,
      );
    }

    return HttpResponse.json({
      access_token: 'mock-access-token',
      expires_in: 900,
      staff: {
        staff_id: 1,
        name: 'Demo Receptionist',
        default_shift_type: 'morning',
      },
      shift: { ...mockShift },
      read_only: false,
    });
  }),

  http.post(`${API}/auth/refresh`, () =>
    HttpResponse.json({
      access_token: 'mock-refreshed-access-token',
      expires_in: 900,
    }),
  ),

  http.get(`${API}/dashboard`, () =>
    HttpResponse.json({
      total_rooms: rooms.length,
      rooms_by_status: {
        available: 1,
        occupied: 1,
        cleaning: 1,
        reserved: 0,
        maintenance: 0,
      },
      rooms_needing_cleaning: cleaningTasks.filter(
        (task) => task.status === 'pending',
      ).length,
      open_maintenance_issues: maintenanceIssues.filter(
        (issue) => issue.status !== 'resolved',
      ).length,
      shift_payments_total: paymentTotals(),
    }),
  ),

  http.get(`${API}/rooms`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const roomType = url.searchParams.get('room_type');

    const filtered = rooms.filter((room) => {
      return (
        (!status || room.status === status) &&
        (!roomType || room.room_type === roomType)
      );
    });

    return HttpResponse.json(paginate(filtered, request));
  }),

  http.get(`${API}/cleaning-tasks`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const roomId = url.searchParams.get('room_id');

    const filtered = cleaningTasks.filter((task) => {
      return (
        (!status || task.status === status) &&
        (!priority || task.priority === priority) &&
        (!roomId || task.room_id === Number(roomId))
      );
    });

    return HttpResponse.json(paginate(filtered, request));
  }),

  http.get(`${API}/maintenance-issues`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const roomId = url.searchParams.get('room_id');

    const filtered = maintenanceIssues.filter((issue) => {
      return (
        (!status || issue.status === status) &&
        (!priority || issue.priority === priority) &&
        (!roomId || issue.room_id === Number(roomId))
      );
    });

    return HttpResponse.json(paginate(filtered, request));
  }),

  http.get(`${API}/payments`, ({ request }) =>
    HttpResponse.json(paginate(payments, request)),
  ),

  http.get(`${API}/shifts/current`, () => {
    if (mockShift.status !== 'active') {
      return errorResponse(
        'NOT_FOUND',
        'No active shift.',
        404,
      );
    }

    return HttpResponse.json({ ...mockShift });
  }),

  http.get(`${API}/shifts/current/summary`, () => {
    if (mockShift.status !== 'active') {
      return errorResponse(
        'NOT_FOUND',
        'No active shift.',
        404,
      );
    }

    return HttpResponse.json({
      shift: { ...mockShift, shift_notes: shiftNotes },
      payments: paymentTotals(),
      check_ins: 1,
      check_outs: 0,
      rooms_handled: [101, 102, 103],
      cleaning_tasks: [...cleaningTasks],
      maintenance_issues: [...maintenanceIssues],
      pending: {
        cleaning_tasks: cleaningTasks.filter(
          (task) => task.status === 'pending',
        ),
        maintenance_issues: maintenanceIssues.filter(
          (issue) => issue.status !== 'resolved',
        ),
        unverified_payments: payments.filter(
          (payment) => !payment.payment_verified,
        ),
      },
    });
  }),

  http.patch(
    `${API}/shifts/current/handover`,
    async ({ request }) => {
      if (mockShift.status === 'handed_over') {
        return errorResponse(
          'SHIFT_CLOSED',
          'This shift has already been handed over.',
          409,
        );
      }

      let body: { shift_notes?: string } = {};

      try {
        body = (await request.json()) as {
          shift_notes?: string;
        };
      } catch {
        // The request body is optional in the API contract.
      }

      if ((body.shift_notes?.length ?? 0) > 2000) {
        return errorResponse(
          'VALIDATION_ERROR',
          'Shift notes must not exceed 2000 characters.',
          400,
        );
      }

      shiftNotes = body.shift_notes ?? null;
      mockShift.shift_notes = shiftNotes;
      mockShift.status = 'handed_over';
      mockShift.handed_over_at = now;

      // Contract: handover returns the Shift object itself.
      return HttpResponse.json({ ...mockShift });
    },
  ),

  http.get(`${API}/shifts/:shift_id/report`, ({ params }) => {
    if (Number(params.shift_id) !== mockShift.shift_id) {
      return errorResponse(
        'NOT_FOUND',
        'Shift report not found.',
        404,
      );
    }

    // Minimal demo PDF bytes; not a real generated shift report.
    const pdf = [
      '%PDF-1.1',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 100] /Contents 4 0 R >> endobj',
      '4 0 obj << /Length 0 >> stream',
      '',
      'endstream endobj',
      'trailer << /Root 1 0 R >>',
      '%%EOF',
    ].join('\n');

    return new HttpResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="shift-report.pdf"',
      },
    });
  }),
];
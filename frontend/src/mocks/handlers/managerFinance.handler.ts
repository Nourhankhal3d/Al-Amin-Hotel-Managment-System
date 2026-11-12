// Mock Service Worker Handlers for Manager Finance
// Implements Manager API Contract v1.2 and /mock-only/ endpoints

import { http, HttpResponse, delay } from 'msw';
import type {
  FinancePaymentDto,
  DailyClosingCurrentDto,
  FinanceExpenseDto,
  HourlyRevenueDto,
} from '../../features/manager-finance/types/manager-finance.dto';
import { FINANCE_BUSINESS_DATE } from '../../features/manager-finance/constants/finance.constants';

const API = '/api/v1';

function shouldMockError(requestUrl: string): boolean {
  try {
    const reqUrl = new URL(requestUrl);
    if (reqUrl.searchParams.get('mockError') === '1') {
      return true;
    }
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && window.location) {
    try {
      const pageUrl = new URL(window.location.href);
      if (pageUrl.searchParams.get('mockError') === '1') {
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

function getMockDelay(requestUrl: string): number {
  try {
    const reqUrl = new URL(requestUrl);
    const d = reqUrl.searchParams.get('mockDelay');
    if (d && !Number.isNaN(Number(d))) return Number(d);
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && window.location) {
    try {
      const pageUrl = new URL(window.location.href);
      const d = pageUrl.searchParams.get('mockDelay');
      if (d && !Number.isNaN(Number(d))) return Number(d);
    } catch {
      // ignore
    }
  }
  return 80; // default smooth responsiveness
}

function mockErrorResponse() {
  return HttpResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'محاكاة خطأ اختباري في بوابة المالية (mockError=1)',
        details: { field: 'mockError', issue: 'forced_test_error' },
      },
    },
    { status: 400 },
  );
}

const STAFF_KARIM = {
  id: '6719b4a1f2e8c90012ab3408',
  name: 'كريم نبيل',
};

// ===================== SEED DATA =====================
// Exactly matching MEMBER_B_MASTER_S3.md:
// 18 transactions, 4 expenses, fixed date 2025-06-18
// Revenue: 24,850 EGP; Expenses: 3,850 EGP; Net: 21,000 EGP; Refunded: 7,200 EGP
// Chips: Instapay: 11,800; Cash: 5,850; Vodafone Cash: 7,200

export const mockPayments: FinancePaymentDto[] = [
  // Visible Row 1: PAY-8421 (matches Figma slice 3-ManagerPaymentsManagement(Revenues)_02.jpg)
  {
    payment_id: '6719b4a1f2e8c90012ab3821',
    transaction_number: 'PAY-8421',
    booking_id: '6719b4a1f2e8c90012ab3901',
    room_number: '204',
    guest_name: 'ضيف الغرفة 204',
    amount: 3200.0,
    currency: 'EGP',
    method: 'INSTAPAY',
    type: 'BOOKING',
    status: 'COMPLETED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'تم استلام الدفعة وتأكيدها ضمن حساب الغرفة خلال الوردية الحالية.',
    created_at: `${FINANCE_BUSINESS_DATE}T11:42:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Visible Row 2: PAY-8420
  {
    payment_id: '6719b4a1f2e8c90012ab3820',
    transaction_number: 'PAY-8420',
    booking_id: '6719b4a1f2e8c90012ab3902',
    room_number: '104',
    guest_name: 'ضيف الغرفة 104',
    amount: 5850.0,
    currency: 'EGP',
    method: 'CASH',
    type: 'BOOKING',
    status: 'COMPLETED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'سداد نقدي مباشر عند الاستقبال',
    created_at: `${FINANCE_BUSINESS_DATE}T11:15:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Visible Row 3: PAY-8419
  {
    payment_id: '6719b4a1f2e8c90012ab3819',
    transaction_number: 'PAY-8419',
    booking_id: '6719b4a1f2e8c90012ab3903',
    room_number: '208',
    guest_name: 'ضيف الغرفة 208',
    amount: 2400.0,
    currency: 'EGP',
    method: 'VODAFONE_CASH',
    type: 'SERVICE',
    status: 'PENDING',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'بانتظار وصول رسالة تأكيد التحويل من المحفظة',
    created_at: `${FINANCE_BUSINESS_DATE}T10:48:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Visible Row 4: PAY-8418 (Refunded 7,200 EGP linked to RF-128)
  {
    payment_id: '6719b4a1f2e8c90012ab3818',
    transaction_number: 'PAY-8418',
    booking_id: '6719b4a1f2e8c90012ab3904',
    room_number: '301',
    guest_name: 'ضيف الغرفة 301',
    amount: 7200.0,
    currency: 'EGP',
    method: 'INSTAPAY',
    type: 'REFUND',
    status: 'REFUNDED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'استرداد قيمة الحجز الملغى بطلب معتمد RF-128',
    created_at: `${FINANCE_BUSINESS_DATE}T10:05:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
    refund_reason: 'إلغاء الحجز لظروف طارئة مع موافقة الإدارة',
    refund_request_id: 'RF-128',
  },
  // Visible Row 5: PAY-8417
  {
    payment_id: '6719b4a1f2e8c90012ab3817',
    transaction_number: 'PAY-8417',
    booking_id: '6719b4a1f2e8c90012ab3905',
    room_number: '110',
    guest_name: 'حجز ملغي',
    amount: 1500.0,
    currency: 'EGP',
    method: 'CASH',
    type: 'BOOKING',
    status: 'CANCELLED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'تم إلغاء الحجز ولم يتم تحصيل المبلغ',
    created_at: `${FINANCE_BUSINESS_DATE}T09:35:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // 13 Generated Rows ensuring totals match: Instapay 11,800, Cash 5,850, Vodafone Cash 7,200
  // Row 6: PAY-8416 (Instapay 2,600)
  {
    payment_id: '6719b4a1f2e8c90012ab3816',
    transaction_number: 'PAY-8416',
    booking_id: '6719b4a1f2e8c90012ab3906',
    room_number: '105',
    guest_name: 'خالد عبد الرحمن',
    amount: 2600.0,
    currency: 'EGP',
    method: 'INSTAPAY',
    type: 'BOOKING',
    status: 'COMPLETED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'إقامة يومين مع وجبات كاملة',
    created_at: `${FINANCE_BUSINESS_DATE}T09:10:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 7: PAY-8415 (Instapay 2,200)
  {
    payment_id: '6719b4a1f2e8c90012ab3815',
    transaction_number: 'PAY-8415',
    booking_id: '6719b4a1f2e8c90012ab3907',
    room_number: '206',
    guest_name: 'هدى مصطفى',
    amount: 2200.0,
    currency: 'EGP',
    method: 'INSTAPAY',
    type: 'BOOKING',
    status: 'COMPLETED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'حجز غرفة عائلية مطلة على المسبح',
    created_at: `${FINANCE_BUSINESS_DATE}T08:45:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 8: PAY-8414 (Instapay 1,800)
  {
    payment_id: '6719b4a1f2e8c90012ab3814',
    transaction_number: 'PAY-8414',
    booking_id: '6719b4a1f2e8c90012ab3908',
    room_number: '304',
    guest_name: 'إبراهيم علي',
    amount: 1800.0,
    currency: 'EGP',
    method: 'INSTAPAY',
    type: 'BOOKING',
    status: 'COMPLETED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'تحويل إنستاباي بنجاح',
    created_at: `${FINANCE_BUSINESS_DATE}T08:20:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 9: PAY-8413 (Instapay 1,200)
  {
    payment_id: '6719b4a1f2e8c90012ab3813',
    transaction_number: 'PAY-8413',
    booking_id: '6719b4a1f2e8c90012ab3909',
    room_number: '108',
    guest_name: 'نورهان مجدي',
    amount: 1200.0,
    currency: 'EGP',
    method: 'INSTAPAY',
    type: 'SERVICE',
    status: 'COMPLETED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'خدمات طعام وضيافة خاصة',
    created_at: `${FINANCE_BUSINESS_DATE}T07:55:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 10: PAY-8412 (Instapay 800)
  {
    payment_id: '6719b4a1f2e8c90012ab3812',
    transaction_number: 'PAY-8412',
    booking_id: '6719b4a1f2e8c90012ab3910',
    room_number: '203',
    guest_name: 'ياسر فوزي',
    amount: 800.0,
    currency: 'EGP',
    method: 'INSTAPAY',
    type: 'SERVICE',
    status: 'COMPLETED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'خدمات غسيل وتجفيف سريع',
    created_at: `${FINANCE_BUSINESS_DATE}T07:30:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 11: PAY-8411 (Vodafone Cash 1,800)
  {
    payment_id: '6719b4a1f2e8c90012ab3811',
    transaction_number: 'PAY-8411',
    booking_id: '6719b4a1f2e8c90012ab3911',
    room_number: '109',
    guest_name: 'هاني سمير',
    amount: 1800.0,
    currency: 'EGP',
    method: 'VODAFONE_CASH',
    type: 'BOOKING',
    status: 'COMPLETED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'تحويل محفظة كاش معتمد',
    created_at: `${FINANCE_BUSINESS_DATE}T07:15:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 12: PAY-8410 (Vodafone Cash 1,500)
  {
    payment_id: '6719b4a1f2e8c90012ab3810',
    transaction_number: 'PAY-8410',
    booking_id: '6719b4a1f2e8c90012ab3912',
    room_number: '205',
    guest_name: 'فاطمة جمال',
    amount: 1500.0,
    currency: 'EGP',
    method: 'VODAFONE_CASH',
    type: 'BOOKING',
    status: 'COMPLETED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'حجز مؤكد عبر الهاتف',
    created_at: `${FINANCE_BUSINESS_DATE}T07:00:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 13: PAY-8409 (Vodafone Cash 1,500)
  {
    payment_id: '6719b4a1f2e8c90012ab3809',
    transaction_number: 'PAY-8409',
    booking_id: '6719b4a1f2e8c90012ab3913',
    room_number: '302',
    guest_name: 'كريم يوسف',
    amount: 1500.0,
    currency: 'EGP',
    method: 'VODAFONE_CASH',
    type: 'BOOKING',
    status: 'COMPLETED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'سداد دفعة إقامة إضافية',
    created_at: `${FINANCE_BUSINESS_DATE}T06:45:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 14: PAY-8408 (Cancelled 500)
  {
    payment_id: '6719b4a1f2e8c90012ab3808',
    transaction_number: 'PAY-8408',
    booking_id: '6719b4a1f2e8c90012ab3914',
    room_number: '202',
    guest_name: 'عمر الدسوقي',
    amount: 500.0,
    currency: 'EGP',
    method: 'CASH',
    type: 'SERVICE',
    status: 'CANCELLED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'إلغاء طلب خدمة مطعم',
    created_at: `${FINANCE_BUSINESS_DATE}T06:30:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 15: PAY-8407 (Cancelled 800)
  {
    payment_id: '6719b4a1f2e8c90012ab3807',
    transaction_number: 'PAY-8407',
    booking_id: '6719b4a1f2e8c90012ab3915',
    room_number: '306',
    guest_name: 'سامح عبد الله',
    amount: 800.0,
    currency: 'EGP',
    method: 'INSTAPAY',
    type: 'SERVICE',
    status: 'CANCELLED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'معاملة غير مكتملة',
    created_at: `${FINANCE_BUSINESS_DATE}T06:15:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 16: PAY-8406 (Cancelled 1,200)
  {
    payment_id: '6719b4a1f2e8c90012ab3806',
    transaction_number: 'PAY-8406',
    booking_id: '6719b4a1f2e8c90012ab3916',
    room_number: '103',
    guest_name: 'داليا إبراهيم',
    amount: 1200.0,
    currency: 'EGP',
    method: 'CARD',
    type: 'BOOKING',
    status: 'CANCELLED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'فشل في عملية تفويض البطاقة',
    created_at: `${FINANCE_BUSINESS_DATE}T06:00:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 17: PAY-8405 (Cancelled 1,500)
  {
    payment_id: '6719b4a1f2e8c90012ab3805',
    transaction_number: 'PAY-8405',
    booking_id: '6719b4a1f2e8c90012ab3917',
    room_number: '107',
    guest_name: 'حسام غالي',
    amount: 1500.0,
    currency: 'EGP',
    method: 'CARD',
    type: 'BOOKING',
    status: 'CANCELLED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'تم إلغاء المعاملة لعدم اكتمال السداد بالبطاقة',
    created_at: `${FINANCE_BUSINESS_DATE}T05:30:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
  // Row 18: PAY-8404 (Cancelled 2,100)
  {
    payment_id: '6719b4a1f2e8c90012ab3804',
    transaction_number: 'PAY-8404',
    booking_id: '6719b4a1f2e8c90012ab3918',
    room_number: '303',
    guest_name: 'منار السيد',
    amount: 2100.0,
    currency: 'EGP',
    method: 'CASH',
    type: 'BOOKING',
    status: 'CANCELLED',
    shift_id: 41,
    shift_type: 'morning',
    staff_id: STAFF_KARIM.id,
    staff_name: STAFF_KARIM.name,
    notes: 'معاملة ملغاة بسبب خطأ إدخال من الموظف',
    created_at: `${FINANCE_BUSINESS_DATE}T05:00:00+03:00`,
    business_date: FINANCE_BUSINESS_DATE,
  },
];

// 4 Expenses: Total 3,850 EGP
export const mockExpenses: FinanceExpenseDto[] = [
  // EXP-108: 1,250 Cleaning (matches Figma slice 3-1-ManagerPaymentsManagement(expenses)_02.jpg)
  {
    expense_id: 'EXP-108',
    description: 'شراء أدوات نظافة ومطهرات ومفروشات جديدة للغرف',
    category: 'CLEANING',
    amount: 1250.0,
    currency: 'EGP',
    recorded_by_staff_id: STAFF_KARIM.id,
    recorded_by_staff_name: STAFF_KARIM.name,
    business_date: FINANCE_BUSINESS_DATE,
    created_at: `${FINANCE_BUSINESS_DATE}T12:10:00+03:00`,
    notes: 'منظفات ومفروشات للوردية',
    invoice_url: '/invoices/exp-108.pdf',
  },
  // EXP-107: 950 Maintenance
  {
    expense_id: 'EXP-107',
    description: 'قطع غيار ولوازم سباكة لصيانة طابق 3',
    category: 'MAINTENANCE',
    amount: 950.0,
    currency: 'EGP',
    recorded_by_staff_id: STAFF_KARIM.id,
    recorded_by_staff_name: STAFF_KARIM.name,
    business_date: FINANCE_BUSINESS_DATE,
    created_at: `${FINANCE_BUSINESS_DATE}T10:40:00+03:00`,
    notes: 'قطع غيار للمكيف',
    invoice_url: '/invoices/exp-107.pdf',
  },
  // EXP-106: 1,200 Electricity (matches Figma slice 3-3-Finance-ExpenseDrawer_01.jpg)
  {
    expense_id: 'EXP-106',
    description: 'سداد فاتورة استهلاك الكهرباء الدورية',
    category: 'UTILITIES',
    amount: 1200.0,
    currency: 'EGP',
    recorded_by_staff_id: STAFF_KARIM.id,
    recorded_by_staff_name: STAFF_KARIM.name,
    business_date: FINANCE_BUSINESS_DATE,
    created_at: `${FINANCE_BUSINESS_DATE}T09:20:00+03:00`,
    notes: 'دفعة فاتورة تشغيلية',
    invoice_url: '/invoices/exp-106.pdf',
  },
  // EXP-105: 450 Emergency
  {
    expense_id: 'EXP-105',
    description: 'مصاريف طارئة وضيافة استقبال وفد رسمي',
    category: 'EMERGENCY',
    amount: 450.0,
    currency: 'EGP',
    recorded_by_staff_id: STAFF_KARIM.id,
    recorded_by_staff_name: STAFF_KARIM.name,
    business_date: FINANCE_BUSINESS_DATE,
    created_at: `${FINANCE_BUSINESS_DATE}T08:35:00+03:00`,
    notes: 'مشتريات عاجلة للضيافة',
    invoice_url: '/invoices/exp-105.pdf',
  },
];

// Current Daily Closing (Contract v1.2 shape)
export const mockDailyClosingCurrent: DailyClosingCurrentDto = {
  closing_id: '6719b4a1f2e8c90012ab3450',
  business_date: FINANCE_BUSINESS_DATE,
  status: 'OPEN',
  cash_total: 5850.0,
  instapay_total: 11800.0,
  vodafone_cash_total: 7200.0,
  gross_revenue: 32050.0,
  refunds_total: 7200.0,
  total_revenue: 24850.0, // gross_revenue - refunds_total
  transactions_count: 18,
  opened_at: `${FINANCE_BUSINESS_DATE}T07:00:00+03:00`,
  closed_at: null,
};

// Hourly revenue series for Finance shift chart
export const mockHourlyRevenue: HourlyRevenueDto = {
  business_date: FINANCE_BUSINESS_DATE,
  hours: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
  points: [3200, 5600, 9450, 14250, 18600, 22400, 24850],
};

// ===================== HANDLERS =====================

function recalculateMockFinanceTotals() {
  const completedOrPending = mockPayments.filter(
    (p) => p.status === 'COMPLETED' || p.status === 'PENDING',
  );
  const refunded = mockPayments.filter((p) => p.status === 'REFUNDED');

  const cash = completedOrPending
    .filter((p) => p.method === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);
  const instapay = completedOrPending
    .filter((p) => p.method === 'INSTAPAY')
    .reduce((sum, p) => sum + p.amount, 0);
  const vodafone = completedOrPending
    .filter((p) => p.method === 'VODAFONE_CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const refundsTotal = refunded.reduce((sum, p) => sum + p.amount, 0);
  const totalRevenue = cash + instapay + vodafone;
  const grossRevenue = totalRevenue + refundsTotal;

  mockDailyClosingCurrent.cash_total = cash;
  mockDailyClosingCurrent.instapay_total = instapay;
  mockDailyClosingCurrent.vodafone_cash_total = vodafone;
  mockDailyClosingCurrent.refunds_total = refundsTotal;
  mockDailyClosingCurrent.total_revenue = totalRevenue;
  mockDailyClosingCurrent.gross_revenue = grossRevenue;

  if (mockHourlyRevenue.points.length > 0) {
    mockHourlyRevenue.points[mockHourlyRevenue.points.length - 1] = totalRevenue;
  }
}

export const managerFinanceHandlers = [
  // 1. GET /payments (Honors page, limit, method, status, type, search)
  http.get(`${API}/payments`, async ({ request }) => {
    if (shouldMockError(request.url)) return mockErrorResponse();
    await delay(getMockDelay(request.url));

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const method = url.searchParams.get('method')?.toUpperCase();
    const status = url.searchParams.get('status')?.toUpperCase();
    const type = url.searchParams.get('type')?.toUpperCase();
    const search = url.searchParams.get('search')?.trim().toLowerCase();

    let filtered = [...mockPayments];

    if (method && method !== 'ALL') {
      filtered = filtered.filter((p) => p.method === method);
    }
    if (status && status !== 'ALL') {
      filtered = filtered.filter((p) => p.status === status);
    }
    if (type && type !== 'ALL') {
      filtered = filtered.filter((p) => p.type === type);
    }
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.transaction_number.toLowerCase().includes(search) ||
          (p.guest_name && p.guest_name.toLowerCase().includes(search)) ||
          (p.room_number && p.room_number.includes(search)) ||
          (p.notes && p.notes.toLowerCase().includes(search)),
      );
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return HttpResponse.json({
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  }),

  // 2. GET /daily-closings/current
  http.get(`${API}/daily-closings/current`, async ({ request }) => {
    if (shouldMockError(request.url)) return mockErrorResponse();
    await delay(getMockDelay(request.url));

    return HttpResponse.json({
      data: mockDailyClosingCurrent,
    });
  }),

  // 3. GET /mock-only/expenses
  http.get(`${API}/mock-only/expenses`, async ({ request }) => {
    if (shouldMockError(request.url)) return mockErrorResponse();
    await delay(getMockDelay(request.url));

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const category = url.searchParams.get('category')?.toUpperCase();
    const date = url.searchParams.get('date');
    const search = url.searchParams.get('search')?.trim().toLowerCase();

    let filtered = [...mockExpenses];

    if (category && category !== 'ALL') {
      filtered = filtered.filter((e) => e.category.toUpperCase() === category);
    }
    if (date && date !== 'ALL') {
      filtered = filtered.filter((e) => e.business_date === date);
    }
    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.expense_id.toLowerCase().includes(search) ||
          e.description.toLowerCase().includes(search) ||
          e.category.toLowerCase().includes(search) ||
          (e.notes && e.notes.toLowerCase().includes(search)) ||
          (search.includes('تنظيف') && e.category === 'CLEANING') ||
          (search.includes('صيانة') && e.category === 'MAINTENANCE') ||
          (search.includes('كهرباء') && e.category === 'UTILITIES') ||
          (search.includes('طارئ') && e.category === 'EMERGENCY'),
      );
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return HttpResponse.json({
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  }),

  // 4. GET /mock-only/finance/hourly-revenue
  http.get(`${API}/mock-only/finance/hourly-revenue`, async ({ request }) => {
    if (shouldMockError(request.url)) return mockErrorResponse();
    await delay(getMockDelay(request.url));

    return HttpResponse.json({
      data: mockHourlyRevenue,
    });
  }),

  // 5. PATCH /mock-only/payments/:id/status
  http.patch(`${API}/mock-only/payments/:id/status`, async ({ params, request }) => {
    if (shouldMockError(request.url)) return mockErrorResponse();
    await delay(getMockDelay(request.url));

    const paymentId = params.id as string;
    const payment = mockPayments.find(
      (p) => p.payment_id === paymentId || p.transaction_number === paymentId,
    );

    if (!payment) {
      return HttpResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'معاملة الدفع غير موجودة',
          },
        },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
      reason?: string;
    };

    if (body.status) {
      payment.status = body.status as FinancePaymentDto['status'];
      recalculateMockFinanceTotals();
    }
    if (body.reason) {
      payment.notes = payment.notes
        ? `${payment.notes} | تعديل حالة: ${body.reason}`
        : body.reason;
    }

    return HttpResponse.json({ data: payment });
  }),

  // 6. PATCH /mock-only/expenses/:id
  http.patch(`${API}/mock-only/expenses/:id`, async ({ params, request }) => {
    if (shouldMockError(request.url)) return mockErrorResponse();
    await delay(getMockDelay(request.url));

    const expenseId = params.id as string;
    const expense = mockExpenses.find((e) => e.expense_id === expenseId);

    if (!expense) {
      return HttpResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'بند المصروفات غير موجود',
          },
        },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as Partial<FinanceExpenseDto>;

    if (body.description) expense.description = body.description;
    if (body.amount !== undefined) expense.amount = Number(body.amount);
    if (body.category) expense.category = body.category.toUpperCase() as FinanceExpenseDto['category'];
    if (body.notes !== undefined) expense.notes = body.notes;

    return HttpResponse.json({ data: expense });
  }),
];

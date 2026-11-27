import { http, HttpResponse } from 'msw';

// Mock for the receptionist's guest survey page.
// Not in the API contract yet: same names as the proposal in features/guest-surveys/types.
const API = '/api/v1';

const QUESTIONS = ['cleanliness', 'staff', 'speed', 'room_quality', 'check_in', 'check_out', 'stay_again', 'recommend'] as const;
type Ratings = Record<(typeof QUESTIONS)[number], number>;
type Status = 'COMPLETED' | 'PENDING_REVIEW';

interface MockStay {
  reservation_id: string;
  guest_name: string;
  room_number: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
}

interface MockSurvey extends MockStay {
  survey_id: string;
  ratings: Ratings;
  had_problem: boolean;
  problem_details: string | null;
  suggestions: string | null;
  overall_rating: number;
  status: Status;
  created_at: string;
}

const DAY = 24 * 60 * 60 * 1000;
const dateOnly = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
const timeAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

let nextId = 1;
const newId = (prefix: string) => `${prefix}${String(6000 + nextId++)}`;

function ratings(values: number[]): Ratings {
  return Object.fromEntries(QUESTIONS.map((question, index) => [question, values[index] ?? 5])) as Ratings;
}

function stay(name: string, room: string, type: string, nights: number, checkOutOffset: number): MockStay {
  return {
    reservation_id: newId('6719b4a1f2e8c90012ab'),
    guest_name: name,
    room_number: room,
    room_type: type,
    check_in_date: dateOnly(checkOutOffset - nights),
    check_out_date: dateOnly(checkOutOffset),
  };
}

function survey(
  base: MockStay,
  values: number[],
  overall: number,
  minutesAgo: number,
  extra: { problem?: string; suggestions?: string; status?: Status } = {},
): MockSurvey {
  return {
    ...base,
    survey_id: newId('6719b4a1f2e8c90013cd'),
    ratings: ratings(values),
    had_problem: Boolean(extra.problem),
    problem_details: extra.problem ?? null,
    suggestions: extra.suggestions ?? null,
    overall_rating: overall,
    status: extra.status ?? 'COMPLETED',
    created_at: timeAgo(minutesAgo),
  };
}

// Seed: surveys from the last few days, newest first in the page
const surveys: MockSurvey[] = [
  survey(stay('مريم أحمد', '304', 'vip', 2, 0), [5, 5, 5, 5, 5, 5, 5, 4], 5, 25, { suggestions: 'إضافة خيارات نباتية أكثر في الإفطار.' }),
  survey(stay('عمر خالد', '208', 'double', 3, 0), [5, 5, 4, 5, 4, 5, 5, 4], 5, 70),
  survey(stay('سلمى علي', '112', 'single', 1, 0), [3, 4, 4, 4, 4, 4, 4, 4], 4, 140, {
    problem: 'التكييف كان ضعيفًا في الليلة الأولى.',
    suggestions: 'متابعة صيانة التكييف قبل وصول النزلاء.',
    status: 'PENDING_REVIEW',
  }),
  survey(stay('يوسف إبراهيم', '210', 'double', 4, -1), [5, 5, 5, 4, 5, 5, 5, 5], 5, 60 * 20),
  survey(stay('هالة محمود', '305', 'suite', 2, -1), [4, 5, 4, 5, 5, 4, 5, 5], 5, 60 * 22, { suggestions: 'تسريع خدمة الغرف في المساء.' }),
  survey(stay('أحمد سمير', '107', 'single', 1, -1), [4, 4, 3, 4, 3, 4, 4, 4], 4, 60 * 23, { problem: 'انتظار طويل عند تسجيل الدخول.' }),
  survey(stay('نادين فؤاد', '301', 'vip', 3, -2), [5, 5, 5, 5, 5, 5, 5, 5], 5, 60 * 44),
  survey(stay('كريم عادل', '203', 'double', 2, -2), [5, 4, 5, 5, 4, 5, 4, 5], 5, 60 * 46, { suggestions: 'إضافة مواقف سيارات أكثر.' }),
  survey(stay('رنا حسن', '110', 'single', 1, -2), [4, 5, 5, 4, 5, 5, 5, 5], 5, 60 * 47),
  survey(stay('طارق منير', '309', 'suite', 5, -3), [5, 5, 4, 5, 5, 4, 5, 5], 5, 60 * 70, { suggestions: 'توفير شاحن هاتف في الغرفة.' }),
  survey(stay('ليلى مصطفى', '205', 'double', 2, -3), [3, 4, 3, 3, 4, 4, 3, 3], 3, 60 * 71, {
    problem: 'صوت مرتفع من الغرفة المجاورة.',
    status: 'PENDING_REVIEW',
  }),
  survey(stay('حسام الدين', '104', 'single', 1, -4), [5, 5, 5, 5, 4, 5, 5, 5], 5, 60 * 95),
  survey(stay('دينا شريف', '302', 'vip', 3, -4), [5, 5, 5, 5, 5, 5, 4, 5], 5, 60 * 96, { suggestions: 'جلسة شاي على السطح عند الغروب.' }),
  survey(stay('محمد ناصر', '207', 'double', 2, -5), [4, 4, 4, 5, 4, 4, 4, 4], 4, 60 * 120, { problem: 'المياه الساخنة تأخرت صباحًا.' }),
];

// Guests checking out today without a survey (the receptionist picks one of these rooms)
const departing: MockStay[] = [
  stay('منى عبد الله', '101', 'single', 2, 0),
  stay('إياد سامح', '105', 'double', 3, 0),
  stay('فاطمة الزهراء', '203', 'double', 1, 0),
  stay('خالد رمضان', '306', 'suite', 4, 0),
  stay('سارة يحيى', '312', 'vip', 2, 0),
];

const TEXT_MAX = 500;

function errorResponse(code: string, message: string, status: number, field?: string) {
  return HttpResponse.json({ error: { code, message, ...(field ? { details: { field } } : {}) } }, { status });
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const isStar = (value: unknown) => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;

export const guestSurveysHandlers = [
  http.get(`${API}/guest-surveys/departing-stays`, () =>
    HttpResponse.json({ data: departing, meta: { page: 1, limit: departing.length, total: departing.length, total_pages: 1 } })),

  http.get(`${API}/guest-surveys`, () =>
    HttpResponse.json({ data: surveys, meta: { page: 1, limit: 100, total: surveys.length, total_pages: 1 } })),

  http.post(`${API}/guest-surveys`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const reservation = departing.find((item) => item.reservation_id === body.reservation_id);
    if (!reservation) {
      if (surveys.some((item) => item.reservation_id === body.reservation_id)) {
        return errorResponse('CONFLICT', 'This stay already has a survey', 409);
      }
      return errorResponse('NOT_FOUND', 'Stay not found', 404, 'reservation_id');
    }
    const given = (body.ratings ?? {}) as Record<string, unknown>;
    if (!QUESTIONS.every((question) => isStar(given[question]))) {
      return errorResponse('VALIDATION_ERROR', 'Every question needs 1 to 5 stars', 400, 'ratings');
    }
    if (!isStar(body.overall_rating)) return errorResponse('VALIDATION_ERROR', 'overall_rating must be 1 to 5', 400, 'overall_rating');
    const hadProblem = body.had_problem === true;
    if (hadProblem && !text(body.problem_details)) {
      return errorResponse('VALIDATION_ERROR', 'problem_details is required when had_problem is true', 400, 'problem_details');
    }
    if (text(body.problem_details).length > TEXT_MAX || text(body.suggestions).length > TEXT_MAX) {
      return errorResponse('VALIDATION_ERROR', 'Text is too long', 400);
    }
    const status: Status = body.status === 'PENDING_REVIEW' ? 'PENDING_REVIEW' : 'COMPLETED';

    const created: MockSurvey = {
      ...reservation,
      survey_id: newId('6719b4a1f2e8c90013cd'),
      ratings: ratings(QUESTIONS.map((question) => Number(given[question]))),
      had_problem: hadProblem,
      problem_details: hadProblem ? text(body.problem_details) : null,
      suggestions: text(body.suggestions) || null,
      overall_rating: Number(body.overall_rating),
      status,
      created_at: new Date().toISOString(),
    };
    surveys.unshift(created);
    departing.splice(departing.indexOf(reservation), 1);
    return HttpResponse.json({ data: created }, { status: 201 });
  }),
];

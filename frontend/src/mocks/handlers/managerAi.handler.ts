import { http, HttpResponse, delay } from 'msw';

// Mock for the manager's AI pages: smart recommendations and the AI assistant (chat).
// Not in the API contract yet: same names as the proposal in features/manager-ai-*/types.
// The real server reads the hotel's numbers and asks the AI; here the answers are written in advance
// from one demo snapshot, so the cards, the recommendations and the chat all tell the same story.
const API = '/api/v1/manager/ai';

type Lang = 'ar' | 'en';
type Text = Record<Lang, string>;
const langOf = (request: Request): Lang => (new URL(request.url).searchParams.get('lang') === 'en' ? 'en' : 'ar');

// ---------------- Demo snapshot (the numbers the AI "reads") ----------------
const SNAPSHOT = {
  occupied_rooms: 29,
  available_rooms: 7,
  maintenance_requests: 2,
  cleaning_requests: 3,
  revenue_today: 26800,
  guest_satisfaction: 4.7,
};

function errorResponse(code: string, message: string, status: number, field?: string) {
  return HttpResponse.json({ error: { code, message, ...(field ? { details: { field } } : {}) } }, { status });
}

// ---------------- Recommendations ----------------
type Category = 'HOUSEKEEPING' | 'MAINTENANCE' | 'FRONT_DESK' | 'FINANCE' | 'GUEST_SATISFACTION' | 'ROOM_MANAGEMENT';
type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
type Review = 'NEW' | 'REVIEWED' | 'LATER';

interface Seed {
  category: Category;
  priority: Priority;
  title: Text;
  summary: Text;
  reason: Text;
  benefit: Text;
  stats: Text[];
  actions: Text[];
}

interface MockRecommendation extends Seed {
  id: string;
  review_status: Review;
  manager_notes: string | null;
  generated_at: string;
}

const SEEDS: Seed[] = [
  {
    category: 'HOUSEKEEPING',
    priority: 'HIGH',
    title: { ar: 'زيادة عدد موظفي التنظيف في الوردية المسائية', en: 'Add housekeepers to the evening shift' },
    summary: { ar: 'إعادة توزيع فريق النظافة خلال ساعات المغادرة المسائية.', en: 'Move part of the cleaning team to the evening check-out hours.' },
    reason: { ar: 'ارتفاع عدد الغرف المنتظرة للتنظيف.', en: 'More rooms are waiting to be cleaned.' },
    benefit: { ar: 'تقليل وقت تجهيز الغرف بنسبة متوقعة ٢٥٪.', en: 'Rooms ready about 25% faster.' },
    stats: [
      { ar: '٣ غرف بانتظار التنظيف · متوسط الانتظار ٤٢ دقيقة', en: '3 rooms waiting for cleaning · 42 min average wait' },
      { ar: '٦٠٪ من المغادرات اليوم بين ٤ و٧ مساءً', en: '60% of today’s check-outs are between 4 and 7 PM' },
    ],
    actions: [
      { ar: 'مراجعة توزيع الموارد الحالي.', en: 'Review how the team is spread across shifts.' },
      { ar: 'تحديد مسؤول للتنفيذ.', en: 'Name a person in charge.' },
      { ar: 'متابعة المؤشر خلال الوردية القادمة.', en: 'Follow the numbers during the next shift.' },
    ],
  },
  {
    category: 'MAINTENANCE',
    priority: 'HIGH',
    title: { ar: 'إجراء صيانة وقائية للتكييف في الطابق الثاني', en: 'Preventive air-conditioning check on the 2nd floor' },
    summary: { ar: 'جدولة فحص وقائي لوحدات التكييف قبل ذروة الإشغال.', en: 'Schedule a check of the AC units before peak occupancy.' },
    reason: { ar: 'تكرار بلاغات الأعطال.', en: 'The same faults keep being reported.' },
    benefit: { ar: 'خفض الأعطال المفاجئة وتحسين رضا النزلاء.', en: 'Fewer sudden breakdowns and happier guests.' },
    stats: [
      { ar: '٤ بلاغات تكييف في الطابق الثاني خلال ٣٠ يومًا', en: '4 AC reports on the 2nd floor in 30 days' },
      { ar: '٢ شكوى من التكييف في استبيانات النزلاء', en: '2 guest-survey complaints about the AC' },
    ],
    actions: [
      { ar: 'فحص وحدات الغرف ٢٠١ إلى ٢١٢.', en: 'Check the units in rooms 201 to 212.' },
      { ar: 'تحديد فني مسؤول وموعد للفحص.', en: 'Assign a technician and a date.' },
      { ar: 'متابعة البلاغات بعد أسبوعين.', en: 'Review the reports again in two weeks.' },
    ],
  },
  {
    category: 'FRONT_DESK',
    priority: 'MEDIUM',
    title: { ar: 'زيادة عدد موظفي الاستقبال خلال فترة الذروة', en: 'More front-desk staff at peak hours' },
    summary: { ar: 'تعزيز مكتب الاستقبال بين الساعة الثانية والخامسة مساءً.', en: 'Add a receptionist between 2 and 5 PM.' },
    reason: { ar: 'ارتفاع ضغط تسجيل الوصول.', en: 'Check-in pressure is rising.' },
    benefit: { ar: 'تقليل متوسط انتظار النزيل عند الوصول.', en: 'Shorter waiting time at check-in.' },
    stats: [
      { ar: '٨ وصولات متوقعة · متوسط الانتظار ٩ دقائق', en: '8 expected arrivals · 9 min average wait' },
    ],
    actions: [
      { ar: 'مراجعة جدول ورديات الاستقبال.', en: 'Review the front-desk shift plan.' },
      { ar: 'إضافة موظف في فترة الذروة.', en: 'Add one receptionist at peak time.' },
    ],
  },
  {
    category: 'GUEST_SATISFACTION',
    priority: 'LOW',
    title: { ar: 'تقديم عروض خاصة للنزلاء المتكررين', en: 'Special offers for returning guests' },
    summary: { ar: 'إعداد مزايا بسيطة للحجوزات المتكررة في الزيارة القادمة.', en: 'Prepare small perks for guests who book again.' },
    reason: { ar: 'زيادة معدل العودة.', en: 'More guests are coming back.' },
    benefit: { ar: 'رفع ولاء النزلاء والحجوزات المباشرة.', en: 'More loyal guests and more direct bookings.' },
    stats: [
      { ar: '١٨ نزيلًا متكررًا · متوسط رضا ٤٫٨', en: '18 returning guests · 4.8 average satisfaction' },
    ],
    actions: [
      { ar: 'تحديد ميزة بسيطة (إفطار مجاني أو تسجيل خروج متأخر).', en: 'Pick a simple perk (free breakfast or late check-out).' },
      { ar: 'إبلاغ الاستقبال بالعرض.', en: 'Tell the front desk about the offer.' },
    ],
  },
  {
    category: 'FINANCE',
    priority: 'MEDIUM',
    title: { ar: 'مراجعة أسعار الغرف خلال موسم الذروة', en: 'Review room prices for the peak season' },
    summary: { ar: 'مراجعة الأسعار اليومية وفق الإشغال المتوقع.', en: 'Adjust daily prices to the expected occupancy.' },
    reason: { ar: 'ارتفاع نسبة الإشغال.', en: 'Occupancy is high.' },
    benefit: { ar: 'تحسين العائد اليومي مع الحفاظ على التنافسية.', en: 'Better daily revenue while staying competitive.' },
    stats: [
      { ar: 'الإشغال ٨٢٪ · الإيرادات أعلى من أمس بنسبة ٨٪', en: '82% occupancy · revenue 8% above yesterday' },
    ],
    actions: [
      { ar: 'مقارنة الأسعار بالفنادق القريبة.', en: 'Compare prices with nearby hotels.' },
      { ar: 'تعديل سعر الغرف المزدوجة في عطلة نهاية الأسبوع.', en: 'Update the weekend price of double rooms.' },
    ],
  },
];

let nextId = 1;
const newId = () => `6719b4a1f2e8c90014ef${String(7000 + nextId++)}`;
const generate = (): MockRecommendation[] => SEEDS.map((seed) => ({
  ...seed,
  id: newId(),
  review_status: 'NEW',
  manager_notes: null,
  generated_at: new Date().toISOString(),
}));
let recommendations = generate();

function toApi(item: MockRecommendation, lang: Lang) {
  return {
    recommendation_id: item.id,
    category: item.category,
    priority: item.priority,
    title: item.title[lang],
    summary: item.summary[lang],
    reason: item.reason[lang],
    expected_benefit: item.benefit[lang],
    supporting_stats: item.stats.map((stat) => stat[lang]),
    suggested_actions: item.actions.map((action) => action[lang]),
    review_status: item.review_status,
    manager_notes: item.manager_notes,
    generated_at: item.generated_at,
  };
}

const listResponse = (lang: Lang) => HttpResponse.json({
  data: recommendations.map((item) => toApi(item, lang)),
  meta: { generated_at: recommendations[0]?.generated_at ?? null },
});

// ---------------- Assistant ----------------
interface MockMessage { message_id: string; role: 'USER' | 'ASSISTANT'; content: string | Text; created_at: string }
interface MockConversation { conversation_id: string; title: string | Text; updated_at: string; messages: MockMessage[] }

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const textIn = (value: string | Text, lang: Lang) => (typeof value === 'string' ? value : value[lang]);

const ANSWERS: Record<string, Text> = {
  summary: {
    ar: 'إليك ملخصًا سريعًا لعمليات الفندق اليوم:\nتم إنهاء جميع عمليات تسليم الورديات بنجاح.\nيوجد طلبا صيانة مفتوحان.\nتوجد ثلاث غرف بانتظار التنظيف.\nنسبة الإشغال الحالية ٨٢٪.\nمتوسط تقييم النزلاء ٤٫٧ من ٥.\nإجمالي الإيرادات أعلى من أمس بنسبة ٨٪.',
    en: 'Here is a quick summary of today’s hotel operations:\nAll shift handovers were completed.\nThere are 2 open maintenance requests.\n3 rooms are waiting for cleaning.\nCurrent occupancy is 82%.\nAverage guest rating is 4.7 out of 5.\nRevenue is 8% higher than yesterday.',
  },
  revenue: {
    ar: 'إيرادات اليوم حتى الآن ٢٦٬٨٠٠ ج.م، أعلى من أمس بنسبة ٨٪.\nالنقدي ١٤٬٢٠٠ ج.م، وإنستاباي ٨٬٤٠٠ ج.م، وفودافون كاش ٤٬٢٠٠ ج.م.\nأنصح بمراجعة أسعار الغرف المزدوجة لأن الإشغال مرتفع.',
    en: 'Today’s revenue so far is EGP 26,800, 8% above yesterday.\nCash EGP 14,200, InstaPay EGP 8,400, Vodafone Cash EGP 4,200.\nWith occupancy this high, I suggest reviewing the price of double rooms.',
  },
  shifts: {
    ar: 'ورديات اليوم:\nالوردية الصباحية سُلّمت في موعدها دون ملاحظات.\nالوردية المسائية تعمل الآن بثلاثة موظفين استقبال.\nلا توجد مبالغ غير مطابقة في تقارير التسليم.',
    en: 'Today’s shifts:\nThe morning shift was handed over on time with no notes.\nThe evening shift is running with 3 receptionists.\nNo cash differences in the handover reports.',
  },
  maintenance: {
    ar: 'يوجد طلبا صيانة مفتوحان:\nغرفة ٢٠٧: تكييف لا يبرد (عاجل، فيه نزيل).\nغرفة ١١٢: تسريب بسيط في الحمام.\nأنصح بالبدء بغرفة ٢٠٧، وجدولة فحص وقائي لتكييف الطابق الثاني لتكرار البلاغات.',
    en: 'There are 2 open maintenance requests:\nRoom 207: AC not cooling (urgent, guest in the room).\nRoom 112: small leak in the bathroom.\nStart with room 207, and plan a preventive AC check on the 2nd floor since the reports keep coming back.',
  },
  cleaning: {
    ar: 'نعم، توجد ثلاث غرف بانتظار التنظيف: ٢٠٧ و٣٠٥ و٢١١.\nغرفة ٣٠٥ أولويتها عاجلة لأن عليها وصول خلال ساعتين.\nمتوسط الانتظار الحالي ٤٢ دقيقة.',
    en: 'Yes, 3 rooms are waiting for cleaning: 207, 305 and 211.\nRoom 305 is urgent because a guest arrives in two hours.\nCurrent average wait is 42 minutes.',
  },
  vacant: {
    ar: 'يوجد ٧ غرف متاحة الآن: ٤ غرف مفردة و٢ مزدوجة وجناح واحد.\nنسبة الإشغال ٨٢٪.',
    en: 'There are 7 available rooms now: 4 single, 2 double and 1 suite.\nOccupancy is 82%.',
  },
  occupied: {
    ar: 'عدد الغرف المشغولة الآن ٢٩ غرفة من أصل ٣٦، أي إشغال ٨٢٪.\nمنها ٥ مغادرات متوقعة اليوم.',
    en: '29 of 36 rooms are occupied now, 82% occupancy.\n5 of them check out today.',
  },
  complaints: {
    ar: 'أبرز شكاوى النزلاء في آخر الاستبيانات:\nضعف التكييف في الطابق الثاني (شكويان).\nانتظار طويل عند تسجيل الدخول (شكوى واحدة).\nصوت مرتفع من غرفة مجاورة (شكوى واحدة).\nمتوسط التقييم العام ما زال ممتازًا: ٤٫٧ من ٥.',
    en: 'Top guest complaints in the latest surveys:\nWeak AC on the 2nd floor (2 complaints).\nLong wait at check-in (1 complaint).\nNoise from a nearby room (1 complaint).\nThe overall rating is still excellent: 4.7 out of 5.',
  },
  issues: {
    ar: 'أهم المشاكل الحالية بالترتيب:\n١. تكييف غرفة ٢٠٧ لا يعمل وفيها نزيل.\n٢. ثلاث غرف بانتظار التنظيف قبل وصولات المساء.\n٣. ضغط على الاستقبال بين ٢ و٥ مساءً.\nراجع صفحة التوصيات الذكية لخطة مقترحة لكل مشكلة.',
    en: 'Current top issues, in order:\n1. Room 207’s AC is down and a guest is in the room.\n2. 3 rooms still need cleaning before evening arrivals.\n3. Front-desk pressure between 2 and 5 PM.\nSee the smart recommendations page for a suggested plan for each.',
  },
  fallback: {
    ar: 'أستطيع مساعدتك في أسئلة عن عمليات الفندق، مثل: الإشغال والغرف المتاحة، التنظيف، الصيانة، الإيرادات، الورديات، وشكاوى النزلاء.\nجرّب مثلًا: «أعطني ملخص اليوم».',
    en: 'I can help with questions about hotel operations: occupancy and available rooms, cleaning, maintenance, revenue, shifts and guest complaints.\nTry for example: “Give me today’s summary”.',
  },
};

const TOPICS: Array<[string, RegExp]> = [
  ['complaints', /شكاو|شكوى|complain/i],
  ['issues', /مشاكل|مشكلة|issue|problem/i],
  ['revenue', /إيراد|ايراد|دخل|revenue|income/i],
  ['shifts', /وردي|shift/i],
  ['maintenance', /صيان|maintenance|repair/i],
  ['cleaning', /تنظيف|نظاف|clean/i],
  ['vacant', /فارغ|متاح|available|vacant|empty/i],
  ['occupied', /مشغول|إشغال|اشغال|occupied|occupancy/i],
  ['summary', /ملخص|summary|اليوم|today/i],
];

function answerFor(question: string, lang: Lang): string {
  const topic = TOPICS.find(([, pattern]) => pattern.test(question))?.[0] ?? 'fallback';
  return ANSWERS[topic][lang];
}

let messageId = 1;
const newMessageId = () => `6719b4a1f2e8c90015aa${String(8000 + messageId++)}`;
let conversationId = 1;
const newConversationId = () => `6719b4a1f2e8c90015bb${String(9000 + conversationId++)}`;

function seedConversation(title: Text, question: Text, topic: string, ago: number, extraQuestions = 0): MockConversation {
  const messages: MockMessage[] = [
    { message_id: newMessageId(), role: 'USER', content: question, created_at: minutesAgo(ago) },
    { message_id: newMessageId(), role: 'ASSISTANT', content: ANSWERS[topic], created_at: minutesAgo(ago) },
  ];
  // Older questions earlier in the same conversation (counted in "today's questions")
  for (let index = 0; index < extraQuestions; index += 1) {
    messages.unshift(
      { message_id: newMessageId(), role: 'USER', content: { ar: 'كم عدد الغرف المشغولة؟', en: 'How many rooms are occupied?' }, created_at: minutesAgo(ago + 10 + index * 5) },
      { message_id: newMessageId(), role: 'ASSISTANT', content: ANSWERS.occupied, created_at: minutesAgo(ago + 10 + index * 5) },
    );
  }
  messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return { conversation_id: newConversationId(), title, updated_at: minutesAgo(ago), messages };
}

const conversations: MockConversation[] = [
  seedConversation({ ar: 'ملخص عمليات اليوم', en: 'Today’s operations summary' }, { ar: 'أعطني ملخص اليوم.', en: 'Give me today’s summary.' }, 'summary', 13, 3),
  seedConversation({ ar: 'حالة الغرف والصيانة', en: 'Rooms and maintenance' }, { ar: 'هل توجد غرف تحتاج صيانة؟', en: 'Are there rooms that need maintenance?' }, 'maintenance', 35, 3),
  seedConversation({ ar: 'مراجعة الإيرادات', en: 'Revenue review' }, { ar: 'ملخص إيرادات اليوم', en: 'Today’s revenue summary' }, 'revenue', 62, 2),
];

const questionCount = (conversation: MockConversation) => conversation.messages.filter((message) => message.role === 'USER').length;

function summaryOf(conversation: MockConversation, lang: Lang) {
  return {
    conversation_id: conversation.conversation_id,
    title: textIn(conversation.title, lang),
    question_count: questionCount(conversation),
    updated_at: conversation.updated_at,
  };
}

function detailOf(conversation: MockConversation, lang: Lang) {
  return {
    ...summaryOf(conversation, lang),
    messages: conversation.messages.map((message) => ({ ...message, content: textIn(message.content, lang) })),
  };
}

const QUESTION_MAX = 500;

export const managerAiHandlers = [
  // ---- Recommendations ----
  http.get(`${API}/recommendations`, ({ request }) => listResponse(langOf(request))),

  http.post(`${API}/recommendations/refresh`, async ({ request }) => {
    await delay(900);
    // A new run keeps the manager's notes on recommendations that are still there
    const notes = new Map(recommendations.map((item) => [item.title.en, item]));
    recommendations = generate().map((item) => {
      const before = notes.get(item.title.en);
      return before ? { ...item, review_status: before.review_status, manager_notes: before.manager_notes } : item;
    });
    return listResponse(langOf(request));
  }),

  http.patch(`${API}/recommendations/:id`, async ({ params, request }) => {
    const found = recommendations.find((item) => item.id === params.id);
    if (!found) return errorResponse('NOT_FOUND', 'Recommendation not found', 404);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (body.review_status !== 'REVIEWED' && body.review_status !== 'LATER') {
      return errorResponse('VALIDATION_ERROR', 'review_status must be REVIEWED or LATER', 400, 'review_status');
    }
    const notes = typeof body.manager_notes === 'string' ? body.manager_notes.trim() : '';
    if (notes.length > 500) return errorResponse('VALIDATION_ERROR', 'manager_notes is too long', 400, 'manager_notes');
    found.review_status = body.review_status;
    found.manager_notes = notes || null;
    return HttpResponse.json({ data: toApi(found, langOf(request)) });
  }),

  // ---- Assistant ----
  http.get(`${API}/overview`, () => HttpResponse.json({ data: SNAPSHOT })),

  http.get(`${API}/conversations`, ({ request }) => {
    const lang = langOf(request);
    const data = [...conversations]
      .filter((conversation) => conversation.messages.length > 0)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((conversation) => summaryOf(conversation, lang));
    return HttpResponse.json({ data, meta: { page: 1, limit: data.length, total: data.length, total_pages: 1 } });
  }),

  http.get(`${API}/conversations/:id`, ({ params, request }) => {
    const found = conversations.find((conversation) => conversation.conversation_id === params.id);
    if (!found) return errorResponse('NOT_FOUND', 'Conversation not found', 404);
    return HttpResponse.json({ data: detailOf(found, langOf(request)) });
  }),

  http.post(`${API}/conversations`, () => {
    const created: MockConversation = {
      conversation_id: newConversationId(),
      title: { ar: 'محادثة جديدة', en: 'New conversation' },
      updated_at: new Date().toISOString(),
      messages: [],
    };
    conversations.push(created);
    return HttpResponse.json({ data: detailOf(created, 'ar') }, { status: 201 });
  }),

  http.post(`${API}/conversations/:id/messages`, async ({ params, request }) => {
    const found = conversations.find((conversation) => conversation.conversation_id === params.id);
    if (!found) return errorResponse('NOT_FOUND', 'Conversation not found', 404);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) return errorResponse('VALIDATION_ERROR', 'content is required', 400, 'content');
    if (content.length > QUESTION_MAX) return errorResponse('VALIDATION_ERROR', 'content is too long', 400, 'content');
    const lang = langOf(request);
    await delay(1100); // the AI "thinking"
    const at = new Date().toISOString();
    // The first question names the conversation
    if (found.messages.length === 0) found.title = content.length > 40 ? `${content.slice(0, 40)}…` : content;
    found.messages.push(
      { message_id: newMessageId(), role: 'USER', content, created_at: at },
      { message_id: newMessageId(), role: 'ASSISTANT', content: answerFor(content, lang), created_at: at },
    );
    found.updated_at = at;
    return HttpResponse.json({ data: detailOf(found, lang) }, { status: 201 });
  }),
];

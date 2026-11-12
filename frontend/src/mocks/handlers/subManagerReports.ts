import { http, HttpResponse } from 'msw';
import type { ReportTransaction, SubManagerReportsData } from '../../features/submanager-reports/types/submanager-reports.types';

const API = '/api/v1';

const report: SubManagerReportsData = {
  reportDate: '2025-06-18',
  transactionCount: 18,
  totalRevenue: 48500,
  totalExpenses: 17500,
  netProfit: 31000,
  collectionRate: 64,
  revenueTrend: 12.8,
  expensesTrend: -4.2,
  profitTrend: 18.6,
  collectionTrend: 3.4,
  paymentBreakdown: [
    { id: 'cash', amount: 18700 },
    { id: 'instapay', amount: 16200 },
    { id: 'card', amount: 13600 },
  ],
  expenseBreakdown: [
    { id: 'cleaning_supplies', amount: 5200 },
    { id: 'utilities', amount: 4900 },
    { id: 'maintenance_supplies', amount: 4300 },
    { id: 'other', amount: 3100 },
  ],
  roomPerformance: [
    { roomType: 'regular', occupancy: 67, rooms: 21, revenue: 28500 },
    { roomType: 'vip', occupancy: 76, rooms: 15, revenue: 20000 },
  ],
  revenueExpenseChart: [
    { label: 'december', revenue: 52, expenses: 16 },
    { label: 'september', revenue: 66, expenses: 20 },
    { label: 'june', revenue: 59, expenses: 15 },
    { label: 'march', revenue: 82, expenses: 27 },
    { label: 'january', revenue: 75, expenses: 19 },
  ],
  transactions: [
    { id: 'TX-1048', type: 'revenue', category: 'room_booking', description: 'حجز غرفة ديلوكس - أحمد محمود', room: '304', date: '2025-06-18', amount: 3200, paymentMethod: 'cash', status: 'completed', floor: '3', roomType: 'vip', roomStatus: 'occupied', shift: 'morning' },
    { id: 'TX-1047', type: 'expense', category: 'cleaning_supplies', description: 'مستلزمات تنظيف الغرف', room: '—', date: '2025-06-18', amount: 1250, paymentMethod: 'cash', status: 'completed', floor: 'all', roomType: 'all', roomStatus: 'all', shift: 'morning' },
    { id: 'TX-1046', type: 'revenue', category: 'room_booking', description: 'حجز غرفة قياسية - سارة علي', room: '208', date: '2025-06-18', amount: 1800, paymentMethod: 'instapay', status: 'completed', floor: '2', roomType: 'regular', roomStatus: 'occupied', shift: 'morning' },
    { id: 'TX-1045', type: 'expense', category: 'maintenance_supplies', description: 'قطع غيار التكييف', room: '412', date: '2025-06-18', amount: 2850, paymentMethod: 'cash', status: 'pending', floor: '4', roomType: 'regular', roomStatus: 'maintenance', shift: 'evening' },
    { id: 'TX-1044', type: 'revenue', category: 'room_booking', description: 'تمديد إقامة - محمد إبراهيم', room: '116', date: '2025-06-17', amount: 2400, paymentMethod: 'card', status: 'completed', floor: '1', roomType: 'regular', roomStatus: 'occupied', shift: 'evening' },
    { id: 'TX-1043', type: 'expense', category: 'utilities', description: 'فاتورة الكهرباء والمياه', room: '—', date: '2025-06-17', amount: 4900, paymentMethod: 'instapay', status: 'completed', floor: 'all', roomType: 'all', roomStatus: 'all', shift: 'morning' },
    { id: 'TX-1042', type: 'revenue', category: 'room_booking', description: 'حجز جناح - منى حسن', room: '501', date: '2025-06-17', amount: 5600, paymentMethod: 'cash', status: 'pending', floor: '5', roomType: 'vip', roomStatus: 'occupied', shift: 'evening' },
    { id: 'TX-1041', type: 'expense', category: 'other', description: 'إصلاح عاجل لمضخة المياه', room: '—', date: '2025-06-16', amount: 3100, paymentMethod: 'cash', status: 'completed', floor: 'all', roomType: 'all', roomStatus: 'all', shift: 'night' },
    { id: 'TX-1040', type: 'revenue', category: 'room_booking', description: 'حجز غرفة ديلوكس - يوسف خالد', room: '317', date: '2025-06-16', amount: 3200, paymentMethod: 'instapay', status: 'completed', floor: '3', roomType: 'vip', roomStatus: 'occupied', shift: 'morning' },
    { id: 'TX-1039', type: 'expense', category: 'maintenance_supplies', description: 'صيانة مصعد الطابق الثاني', room: '—', date: '2025-06-16', amount: 1450, paymentMethod: 'card', status: 'completed', floor: '2', roomType: 'all', roomStatus: 'maintenance', shift: 'night' },
    { id: 'TX-1038', type: 'revenue', category: 'room_booking', description: 'حجز غرفة قياسية - ليلى عمر', room: '109', date: '2025-06-15', amount: 1800, paymentMethod: 'cash', status: 'completed', floor: '1', roomType: 'regular', roomStatus: 'occupied', shift: 'morning' },
    { id: 'TX-1037', type: 'expense', category: 'cleaning_supplies', description: 'مواد تنظيف ومطهرات', room: '—', date: '2025-06-15', amount: 3950, paymentMethod: 'instapay', status: 'pending', floor: 'all', roomType: 'all', roomStatus: 'all', shift: 'evening' },
  ],
};

function isValidDate(value: string | null): boolean {
  return value === null || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const subManagerReportsHandlers = [
  http.get(`${API}/sub-manager/reports`, ({ request }) => {
    const url = new URL(request.url);
    const requestedFrom = url.searchParams.get('from');
    const requestedTo = url.searchParams.get('to');
    if (!isValidDate(requestedFrom) || !isValidDate(requestedTo)) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Dates must use YYYY-MM-DD format.' } },
        { status: 400 },
      );
    }

    const period = url.searchParams.get('period');
    const reportDay = new Date(`${report.reportDate}T12:00:00`);
    const periodStart = new Date(reportDay);
    if (period === 'week') periodStart.setDate(reportDay.getDate() - 6);
    else if (period === 'month') periodStart.setDate(1);
    else if (period === 'year') periodStart.setMonth(0, 1);
    const from = requestedFrom ?? periodStart.toISOString().slice(0, 10);
    const to = requestedTo ?? report.reportDate;
    const transactions = report.transactions.filter((transaction: ReportTransaction) => (
      transaction.date >= from
      && transaction.date <= to
      && (!url.searchParams.get('category') || transaction.category === url.searchParams.get('category'))
      && (!url.searchParams.get('status') || transaction.status === url.searchParams.get('status'))
      && (!url.searchParams.get('paymentMethod') || transaction.paymentMethod === url.searchParams.get('paymentMethod'))
      && (!url.searchParams.get('room') || transaction.room === url.searchParams.get('room'))
      && (!url.searchParams.get('type') || transaction.type === url.searchParams.get('type'))
      && (!url.searchParams.get('floor') || transaction.floor === url.searchParams.get('floor'))
      && (!url.searchParams.get('roomType') || transaction.roomType === url.searchParams.get('roomType'))
      && (!url.searchParams.get('roomStatus') || transaction.roomStatus === url.searchParams.get('roomStatus'))
      && (!url.searchParams.get('shift') || transaction.shift === url.searchParams.get('shift'))
    ));

    const hasFilters = Boolean(requestedFrom || requestedTo || url.searchParams.get('category')
      || url.searchParams.get('status') || url.searchParams.get('paymentMethod')
      || url.searchParams.get('room') || url.searchParams.get('type')
      || url.searchParams.get('floor') || url.searchParams.get('roomType')
      || url.searchParams.get('roomStatus') || url.searchParams.get('shift'));
    if (!hasFilters) return HttpResponse.json({ ...report, transactions });

    const totalRevenue = transactions
      .filter((transaction) => transaction.type === 'revenue')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const totalExpenses = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const completedRevenue = transactions
      .filter((transaction) => transaction.type === 'revenue' && transaction.status === 'completed')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const paymentBreakdown = [...new Set(transactions
      .filter((transaction) => transaction.type === 'revenue')
      .map((transaction) => transaction.paymentMethod))]
      .map((id) => ({
        id,
        amount: transactions
          .filter((transaction) => transaction.type === 'revenue' && transaction.paymentMethod === id)
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      }));
    const expenseBreakdown = [...new Set(transactions
      .filter((transaction) => transaction.type === 'expense')
      .map((transaction) => transaction.category))]
      .map((id) => ({
        id,
        amount: transactions
          .filter((transaction) => transaction.type === 'expense' && transaction.category === id)
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      }));

    return HttpResponse.json({
      ...report,
      transactionCount: transactions.length,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      collectionRate: totalRevenue ? Math.round(completedRevenue / totalRevenue * 100) : 0,
      paymentBreakdown,
      expenseBreakdown,
      transactions,
    });
  }),
];

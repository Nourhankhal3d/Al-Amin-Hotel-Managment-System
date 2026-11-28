/**
 * Extra details for the shift handover PDF only.
 *
 * The shift summary (buildSummary) stays exactly as the API returns it; this module
 * reads the rest of what happened in the shift so the PDF can show it in full:
 * room numbers instead of ids, every payment and expense, cleaning and maintenance
 * details, guest surveys and the items left for the next shift.
 *
 * Filters use mongoose.trusted() because the app turns on sanitizeFilter (like reservation.service).
 */
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const {
  Room,
  Guest,
  Reservation,
  Payment,
  Expense,
  GuestSurvey,
  CleaningTask,
  MaintenanceIssue,
} = require('../../db/models');
const { ZONE } = require('../../utils/time');
const { toEGP } = require('../../utils/money');

const clock = (date) => (date ? DateTime.fromJSDate(new Date(date)).setZone(ZONE).toFormat('HH:mm') : '');
const byRoomNumber = (a, b) => String(a.room_number).localeCompare(String(b.room_number), 'en', { numeric: true });

async function roomNumbersById(ids) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (unique.length === 0) return new Map();
  const rooms = await Room.find({ _id: mongoose.trusted({ $in: unique }) }).select('room_number').lean();
  return new Map(rooms.map((room) => [String(room._id), room.room_number]));
}

async function buildReportDetails(shift, summary) {
  const [payments, expenses, surveys, pendingCleaning, pendingMaintenance] = await Promise.all([
    Payment.find({ shift_id: shift._id }).sort({ payment_datetime: 1 }).lean(),
    Expense.find({ shift_id: shift._id }).sort({ expense_datetime: 1 }).lean(),
    GuestSurvey.find({ shift_id: shift._id }).sort({ created_at: 1 }).lean(),
    CleaningTask.find({ status: 'pending' }).lean(),
    MaintenanceIssue.find({ status: mongoose.trusted({ $in: ['open', 'in_progress'] }) }).lean(),
  ]);

  // Payment -> reservation -> room number and guest name
  const reservations = await Reservation.find({ _id: mongoose.trusted({ $in: payments.map((p) => p.reservation_id) }) })
    .select('room_id guest_id')
    .lean();
  const reservationById = new Map(reservations.map((r) => [String(r._id), r]));
  const guests = await Guest.find({ _id: mongoose.trusted({ $in: reservations.map((r) => r.guest_id) }) }).select('name').lean();
  const guestNameById = new Map(guests.map((g) => [String(g._id), g.name]));

  const shiftCleaning = summary.cleaning_tasks || [];
  const shiftMaintenance = summary.maintenance_issues || [];
  const roomNumbers = await roomNumbersById([
    ...(summary.rooms_handled || []),
    ...reservations.map((r) => r.room_id),
    ...shiftCleaning.map((t) => t.room_id),
    ...shiftMaintenance.map((i) => i.room_id),
    ...pendingCleaning.map((t) => t.room_id),
    ...pendingMaintenance.map((i) => i.room_id),
  ]);
  const roomOf = (id) => roomNumbers.get(String(id)) || '—';

  const paymentRows = payments.map((payment) => {
    const reservation = reservationById.get(String(payment.reservation_id));
    return {
      time: clock(payment.payment_datetime),
      room_number: reservation ? roomOf(reservation.room_id) : '—',
      guest_name: reservation ? guestNameById.get(String(reservation.guest_id)) || '—' : '—',
      method: payment.payment_method,
      amount: toEGP(payment.amount),
      verified: Boolean(payment.payment_verified),
      is_reversal: Boolean(payment.reversal_of_payment_id),
    };
  });

  const expenseRows = expenses.map((expense) => ({
    time: clock(expense.expense_datetime),
    category: expense.category,
    amount: toEGP(expense.amount),
    notes: expense.notes || '',
  }));
  const expensesTotal = toEGP(expenses.reduce((sum, e) => sum + e.amount, 0));
  const ratingSum = surveys.reduce((sum, s) => sum + Number(s.overall_rating || 0), 0);

  return {
    rooms_handled: (summary.rooms_handled || []).map(roomOf).filter((n) => n !== '—')
      .sort((a, b) => String(a).localeCompare(String(b), 'en', { numeric: true })),
    payments: paymentRows,
    expenses: expenseRows,
    expenses_total: expensesTotal,
    net: Number((Number(summary.payments?.total || 0) - expensesTotal).toFixed(2)),
    cleaning_tasks: shiftCleaning
      .map((t) => ({ room_number: roomOf(t.room_id), priority: t.priority, status: t.status, cleaner_name: t.cleaner_name || '', notes: t.notes || '' }))
      .sort(byRoomNumber),
    maintenance_issues: shiftMaintenance
      .map((i) => ({ room_number: roomOf(i.room_id), problem: i.problem, priority: i.priority, status: i.status }))
      .sort(byRoomNumber),
    surveys: {
      count: surveys.length,
      average: surveys.length ? Number((ratingSum / surveys.length).toFixed(1)) : null,
      items: surveys.map((s) => ({
        room_number: s.room_number,
        guest_name: s.guest_name,
        overall_rating: s.overall_rating,
        had_problem: Boolean(s.had_problem),
      })),
    },
    pending: {
      cleaning: pendingCleaning.map((t) => ({ room_number: roomOf(t.room_id), priority: t.priority })).sort(byRoomNumber),
      maintenance: pendingMaintenance
        .map((i) => ({ room_number: roomOf(i.room_id), problem: i.problem, status: i.status }))
        .sort(byRoomNumber),
      unverified_payments: paymentRows.filter((p) => !p.verified),
    },
  };
}

module.exports = { buildReportDetails };

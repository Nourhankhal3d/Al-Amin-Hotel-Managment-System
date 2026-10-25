const { DateTime } = require('luxon');
const { toEgp } = require('../../utils/money');
const { ZONE } = require('../../utils/time');

const cairoIso = (d) => (d ? DateTime.fromJSDate(new Date(d)).setZone(ZONE).toISO() : null);

function toExpenseDto(e) {
  return {
    expense_id: String(e._id),
    staff_id: String(e.staff_id),
    shift_id: String(e.shift_id),
    category: e.category,
    amount: toEgp(e.amount),
    notes: e.notes || null,
    expense_datetime: cairoIso(e.expense_datetime),
  };
}

module.exports = { toExpenseDto };
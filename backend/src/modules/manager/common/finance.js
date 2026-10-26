
const Payment = require('../../../db/models/Payment');
const CancellationSettlement = require('../../../db/models/CancellationSettlement');

const KEY = {
  cash: 'cash_total',
  instapay: 'instapay_total',
  vodafone_cash: 'vodafone_cash_total',
};

const PIASTRES_PER_EGP = 100;

async function financialsForShifts(shiftIds, session) {
  const rows = await Payment.aggregate([
    { $match: { shift_id: { $in: shiftIds } } },
    {
      $group: {
        _id: { m: '$payment_method', t: '$payment_type' },
        sum: { $sum: '$amount' },
      },
    },
  ]).session(session || null);

  const totals = {
    cash_total: 0,
    instapay_total: 0,
    vodafone_cash_total: 0,
    refunds_total: 0,
  };

  for (const row of rows) {
    const amount = row.sum / PIASTRES_PER_EGP;

    if (row._id.t === 'refund') {
      totals.refunds_total += -amount;
    } else if (KEY[row._id.m]) {
      totals[KEY[row._id.m]] += amount;
    }
  }

  totals.gross_revenue =
    totals.cash_total + totals.instapay_total + totals.vodafone_cash_total;
  totals.net_revenue = totals.gross_revenue - totals.refunds_total;

  return totals;
}

async function retainedForShifts(shiftIds, session) {
  const [result] = await CancellationSettlement.aggregate([
    { $match: { shift_id: { $in: shiftIds } } },
    {
      $group: {
        _id: null,
        total: { $sum: '$retained_amount' },
      },
    },
  ]).session(session || null);

  return result ? result.total / PIASTRES_PER_EGP : 0;
}

module.exports = { financialsForShifts, retainedForShifts };

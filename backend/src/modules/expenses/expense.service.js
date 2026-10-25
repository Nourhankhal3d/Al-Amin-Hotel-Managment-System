const mongoose = require('mongoose');
const { Expense } = require('../../db/models');
const { E } = require('../../utils/errors');
const { toPiastres } = require('../../utils/money');
const { sanitizeText } = require('../../utils/arabic');
const { paginate } = require('../../utils/paginate');
const { audit } = require('../audit/audit.service');
const { AUDIT } = require('../audit/audit.actions');
const { toExpenseDto } = require('./expense.dto');

const isDuplicateKey = (err) => err && err.code === 11000;

function parseAmount(raw) {
  let amount;
  try {
    amount = toPiastres(raw);
  } catch (e) {
    throw E.validation('amount must have at most 2 decimal places');
  }
  if (!Number.isSafeInteger(amount) || amount <= 0) throw E.validation('amount must be greater than 0');
  return amount;
}

async function createExpense({
  category, amount: rawAmount, notes,
  staff, shift, ip, now, idempotencyKey,
}) {
  if (!Expense.CATEGORIES.includes(category)) throw E.validation('Invalid expense category');
  const amount = parseAmount(rawAmount);

  let result;
  const session = await mongoose.startSession();
  try {
    // expense + audit log = two collections, so one transaction
    await session.withTransaction(async () => {
      const [expense] = await Expense.create(
        [{
          staff_id: staff._id,
          shift_id: shift._id,
          category,
          amount,
          notes: notes ? sanitizeText(notes) : '',
          expense_datetime: now,
          idempotency_key: idempotencyKey || null,
        }],
        { session }
      );

      await audit(
        {
          action: AUDIT.EXPENSE_CREATED,
          actorStaffId: staff._id,
          entity: 'Expense',
          entityId: String(expense._id),
          details: { category, amount },
          ip,
        },
        { session }
      );

      result = toExpenseDto(expense.toObject());
    });
  } catch (err) {
    if (isDuplicateKey(err)) throw E.conflict('This expense was already recorded');
    throw err;
  } finally {
    await session.endSession();
  }

  return result;
}

// Current shift only (a read-only session has no shift_id, so the list is empty)
async function listShiftExpenses({ shiftId, page = 1, limit = 20 }) {
  if (!shiftId) return { data: [], meta: { page, limit, total: 0 } };
  return paginate(
    Expense,
    { shift_id: shiftId },
    {
      page: Number(page),
      limit: Number(limit),
      sort: { expense_datetime: -1 },
    },
    toExpenseDto
  );
}

module.exports = { createExpense, listShiftExpenses };
const expenseService = require('./expense.service');
const { getNow } = require('../../utils/clock');

async function createExpense(req, res, next) {
  try {
    // only the allowed fields by name; staff_id, shift_id and the time always come from the server
    const { category, amount, notes } = req.body;
    const result = await expenseService.createExpense({
      category,
      amount,
      notes,
      staff: req.auth.staff,
      shift: req.shift,
      ip: req.ip,
      now: getNow(req),
      idempotencyKey: req.get('Idempotency-Key'),
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function listShiftExpenses(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await expenseService.listShiftExpenses({
      shiftId: req.auth.session.shift_id,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { createExpense, listShiftExpenses };
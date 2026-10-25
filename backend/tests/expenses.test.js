const request = require('supertest');
const { randomUUID } = require('crypto');
const argon2 = require('argon2');
const { DateTime } = require('luxon');
const mongoose = require('mongoose');
const app = require('../src/app');
const { Staff, Shift, Attendance, Expense, AuditLog } = require('../src/db/models');
const { ZONE } = require('../src/utils/time');

describe('Expenses', () => {
  const password = 'Password123';
  const today = '2026-10-15';
  const NOW = DateTime.fromISO(`${today}T13:00:00`, { zone: ZONE }).toISO();

  let passwordHash;
  let token;
  let staff;
  let shiftId;

  const auth = (t = token) => ({ Authorization: `Bearer ${t}` });
  const nextKey = () => randomUUID();

  const spend = (body, key = nextKey(), headers = {}) =>
    request(app)
      .post('/api/v1/expenses')
      .set(auth())
      .set('x-test-time', NOW)
      .set('Idempotency-Key', key)
      .set(headers)
      .send(body);

  beforeAll(async () => {
    passwordHash = await argon2.hash(password);
  });

  beforeEach(async () => {
    await Promise.all([
      Staff.deleteMany({}),
      Shift.deleteMany({}),
      Attendance.deleteMany({}),
      Expense.collection.deleteMany({}), // the append-only hooks block the normal deleteMany
      AuditLog.collection.deleteMany({}),
    ]);

    staff = await Staff.create({
      username: 'ahmed_morning',
      name: 'Ahmed Morning',
      password_hash: passwordHash,
      default_shift_type: 'morning',
      role: 'receptionist',
      active: true,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('x-test-time', NOW)
      .send({ username: 'ahmed_morning', password });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: status=${loginRes.status}, body=${loginRes.text}`);
    }
    token = loginRes.body.access_token;
    shiftId = loginRes.body.shift.shift_id;
  });

  test('records an expense and the server sets staff, shift and time', async () => {
    const res = await spend({ category: 'electricity', amount: 450, notes: 'Electricity bill' });

    expect(res.status).toBe(201);
    expect(res.body.category).toBe('electricity');
    expect(res.body.amount).toBe(450);
    expect(res.body.notes).toBe('Electricity bill');
    expect(res.body.staff_id).toBe(String(staff._id));
    expect(res.body.shift_id).toBe(String(shiftId));
    expect(Date.parse(res.body.expense_datetime)).toBe(Date.parse(NOW));
    expect(await Expense.countDocuments({})).toBe(1);
  });

  test('stores the amount in piastres and writes an audit entry', async () => {
    const res = await spend({ category: 'water', amount: 450.5 });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(450.5);

    const saved = await Expense.findById(res.body.expense_id);
    expect(saved).not.toBeNull();
    expect(saved.amount).toBe(45050);

    const log = await AuditLog.findOne({ action: 'EXPENSE_CREATED' });
    expect(log).not.toBeNull();
    expect(log.entity_id).toBe(res.body.expense_id);
  });

  test('rejects zero, negative and 3-decimal amounts', async () => {
    for (const amount of [0, -50, 10.123]) {
      const res = await spend({ category: 'other', amount });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect(await Expense.countDocuments({})).toBe(0);
  });

  test('rejects an unknown or missing category', async () => {
    const bad = await spend({ category: 'pizza', amount: 100 });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');

    const missing = await spend({ amount: 100 });
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('VALIDATION_ERROR');

    expect(await Expense.countDocuments({})).toBe(0);
  });

  test('same Idempotency-Key records one expense only', async () => {
    const key = nextKey();
    const body = { category: 'internet', amount: 300 };

    const first = await spend(body, key);
    expect(first.status).toBe(201);

    const second = await spend(body, key);
    expect(second.status).toBe(201);
    expect(second.body.expense_id).toBe(first.body.expense_id);
    expect(second.headers['idempotent-replayed']).toBe('true');

    expect(await Expense.countDocuments({})).toBe(1);
  });

  test('same Idempotency-Key with a different body is rejected', async () => {
    const key = nextKey();
    const first = await spend({ category: 'internet', amount: 300 }, key);
    expect(first.status).toBe(201);

    const second = await spend({ category: 'internet', amount: 999 }, key);
    expect(second.status).toBe(400);
    expect(second.body.error.code).toBe('VALIDATION_ERROR');
    expect(await Expense.countDocuments({})).toBe(1);
  });

  test('ignores staff_id, shift_id and expense_datetime sent by the client', async () => {
    const fake = new mongoose.Types.ObjectId().toString();
    const res = await spend({
      category: 'emergency',
      amount: 120,
      staff_id: fake,
      shift_id: fake,
      expense_datetime: '2000-01-01T00:00:00.000Z',
    });

    expect(res.status).toBe(201);
    expect(res.body.staff_id).toBe(String(staff._id));
    expect(res.body.shift_id).toBe(String(shiftId));
    expect(Date.parse(res.body.expense_datetime)).toBe(Date.parse(NOW));
  });

  test('a read-only session (before the shift starts) cannot record an expense', async () => {
    await Promise.all([Shift.deleteMany({}), Attendance.deleteMany({})]);
    const early = DateTime.fromISO(`${today}T06:40:00`, { zone: ZONE }).toISO();

    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('x-test-time', early)
      .send({ username: 'ahmed_morning', password });
    expect(login.status).toBe(200);
    expect(login.body.read_only).toBe(true);

    const res = await request(app)
      .post('/api/v1/expenses')
      .set(auth(login.body.access_token))
      .set('x-test-time', early)
      .set('Idempotency-Key', nextKey())
      .send({ category: 'water', amount: 50 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(await Expense.countDocuments({})).toBe(0);
  });

  test('after handover the shift is closed (409 SHIFT_CLOSED)', async () => {
    const handover = await request(app)
      .patch('/api/v1/shifts/current/handover')
      .set(auth())
      .set('x-test-time', NOW)
      .send({ shift_notes: 'done' });
    expect(handover.status).toBe(200);

    const res = await spend({ category: 'water', amount: 50 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SHIFT_CLOSED');
    expect(await Expense.countDocuments({})).toBe(0);
  }, 30000);

  test('GET lists the current shift expenses only', async () => {
    await spend({ category: 'electricity', amount: 100 });
    await spend({ category: 'water', amount: 200 });

    // an expense from some other shift must not appear
    await Expense.create({
      staff_id: staff._id,
      shift_id: new mongoose.Types.ObjectId(),
      category: 'other',
      amount: 5000,
      expense_datetime: new Date(),
    });

    const res = await request(app)
      .get('/api/v1/expenses')
      .set(auth())
      .set('x-test-time', NOW);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
    for (const row of res.body.data) {
      expect(row.shift_id).toBe(String(shiftId));
    }
  });

  test('expenses are append-only', async () => {
    await spend({ category: 'water', amount: 75 });
    await expect(Expense.deleteMany({})).rejects.toThrow('append-only');
    await expect(Expense.updateOne({}, { amount: 1 })).rejects.toThrow('append-only');
    expect(await Expense.countDocuments({})).toBe(1);
  });
});
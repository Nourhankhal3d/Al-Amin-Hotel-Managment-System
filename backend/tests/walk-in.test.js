const request = require('supertest');
const argon2 = require('argon2');
const crypto = require('crypto');
const { DateTime } = require('luxon');
const app = require('../src/app');
const {
  Staff,
  Shift,
  Attendance,
  Room,
  RoomNight,
  Reservation,
  Payment,
  Guest,
  CleaningTask,
  RoomStatusHistory,
  AuditLog,
} = require('../src/db/models');
const { AUDIT } = require('../src/modules/audit/audit.actions');
const { ZONE } = require('../src/utils/time');
const { toPiastres } = require('../src/utils/money');

describe('Walk-in: instant stay (POST /api/v1/reservations/walk-in)', () => {
  const password = 'Password123';
  const today = '2026-10-15';
  const Cairo13 = DateTime.fromISO(`${today}T13:00:00`, { zone: ZONE }).toISO();
  const Cairo09 = DateTime.fromISO(`${today}T09:00:00`, { zone: ZONE }).toISO();

  const CHECK_IN = '2026-10-15T12:00:00+03:00';
  const CHECK_OUT = '2026-10-17T12:00:00+03:00'; // 2 nights x 1500 = 3000 EGP
  const FULL = 3000;
  const FULL_EARLY = 3500; // + half-day 500

  const uid = () => crypto.randomUUID();

  let token;

  const auth = () => ({ Authorization: `Bearer ${token}` });

  const newGuest = (overrides = {}) => ({
    name: 'محمد أحمد',
    phone: '01012345678',
    id_number: 'AB12345678',
    ...overrides,
  });

  const createRoom = (overrides = {}) =>
    Room.create({
      room_number: '301',
      room_type: 'deluxe',
      floor: 3,
      price_per_night: toPiastres(1500),
      half_day_price: toPiastres(500),
      status: 'available',
      ...overrides,
    });

  const walkIn = (body, { key, time } = {}) =>
    request(app)
      .post('/api/v1/reservations/walk-in')
      .set(auth())
      .set('Idempotency-Key', key || uid())
      .set('x-test-time', time || Cairo13)
      .send(body);

  const baseBody = (room, overrides = {}) => ({
    new_guest: newGuest(),
    room_id: String(room._id),
    check_in: CHECK_IN,
    check_out: CHECK_OUT,
    payment: { amount: FULL, payment_method: 'cash' },
    ...overrides,
  });

  // helper: create a guest through the normal API
  const createGuestApi = async (overrides = {}) => {
    const res = await request(app)
      .post('/api/v1/guests')
      .set(auth())
      .set('x-test-time', Cairo13)
      .send(newGuest(overrides));
    expect(res.status).toBe(201);
    return res.body.guest_id;
  };

  // helper: assert that nothing was written
  const expectNothingWritten = async (room) => {
    expect(await Guest.countDocuments({})).toBe(0);
    expect(await Reservation.countDocuments({})).toBe(0);
    expect(await RoomNight.countDocuments({})).toBe(0);
    expect(await Payment.countDocuments({})).toBe(0);
    const fresh = await Room.findById(room._id);
    expect(fresh.status).toBe('available');
  };

  beforeEach(async () => {
    await Promise.all([
      Staff.deleteMany({}),
      Shift.deleteMany({}),
      Attendance.deleteMany({}),
      Room.deleteMany({}),
      RoomNight.deleteMany({}),
      Reservation.deleteMany({}),
      Payment.collection.deleteMany({}),
      Guest.deleteMany({}),
      CleaningTask.deleteMany({}),
      RoomStatusHistory.deleteMany({}),
      AuditLog.collection.deleteMany({}),
    ]);

    const passwordHash = await argon2.hash(password);
    await Staff.create({
      username: 'reception_walkin',
      name: 'Receptionist WalkIn',
      password_hash: passwordHash,
      default_shift_type: 'morning',
      role: 'receptionist',
      active: true,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('x-test-time', Cairo13)
      .send({ username: 'reception_walkin', password });

    expect(loginRes.status).toBe(200);
    token = loginRes.body.access_token;
  });

  test('success with a new guest: guest + reservation + payment + check-in in one go', async () => {
    const room = await createRoom();
    const res = await walkIn(baseBody(room));

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('checked_in');

    expect(await Guest.countDocuments({})).toBe(1);
    expect(await Payment.countDocuments({})).toBe(1);
    expect(await RoomNight.countDocuments({})).toBe(2);

    const reservation = await Reservation.findOne({});
    expect(reservation.status).toBe('checked_in');
    expect(reservation.total_amount).toBe(toPiastres(FULL));
    expect(reservation.paid_cache).toBe(toPiastres(FULL));
    expect(reservation.early_arrival).toBe(false);

    const roomDoc = await Room.findById(room._id);
    expect(roomDoc.status).toBe('occupied');

    const history = await RoomStatusHistory.find({ room_id: room._id }).lean();
    expect(history.some((h) => h.status === 'occupied')).toBe(true);

    const actions = (await AuditLog.collection.find({}).toArray()).map((a) => a.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        AUDIT.GUEST_CREATED,
        AUDIT.RESERVATION_CREATED,
        AUDIT.PAYMENT_CREATED,
        AUDIT.CHECK_IN,
      ])
    );
  });

  test('success with an existing guest_id (no new guest is created)', async () => {
    const room = await createRoom();
    const guest_id = await createGuestApi();

    const body = baseBody(room);
    delete body.new_guest;
    body.guest_id = guest_id;

    const res = await walkIn(body);

    expect(res.status).toBe(201);
    expect(await Guest.countDocuments({})).toBe(1);
    const reservation = await Reservation.findOne({});
    expect(reservation.status).toBe('checked_in');
    expect(String(reservation.guest_id)).toBe(guest_id);
  });

  test('partial first payment is allowed: check-in works and remaining is correct', async () => {
    const room = await createRoom();
    const res = await walkIn(baseBody(room, { payment: { amount: 1000, payment_method: 'cash' } }));

    expect(res.status).toBe(201);
    const reservation = await Reservation.findOne({});
    expect(reservation.status).toBe('checked_in');
    expect(reservation.paid_cache).toBe(toPiastres(1000));
    expect(reservation.total_amount - reservation.paid_cache).toBe(toPiastres(2000));
  });

  test('payment above remaining is rejected with 400 and EVERYTHING rolls back (even the new guest)', async () => {
    const room = await createRoom();
    const res = await walkIn(baseBody(room, { payment: { amount: FULL + 1, payment_method: 'cash' } }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    await expectNothingWritten(room);
  });

  test('room not available (cleaning) returns 409 and nothing is written', async () => {
    const room = await createRoom({ status: 'cleaning' });
    const res = await walkIn(baseBody(room));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(await Guest.countDocuments({})).toBe(0);
    expect(await Reservation.countDocuments({})).toBe(0);
    expect(await Payment.countDocuments({})).toBe(0);
    const fresh = await Room.findById(room._id);
    expect(fresh.status).toBe('cleaning');
  });

  test('double booking: overlapping future booking on the same room returns 409 and rolls back', async () => {
    const room = await createRoom();
    const otherGuest = await createGuestApi({ phone: '01111111111', id_number: 'ZZ99999999' });

    // an existing booking that starts tomorrow (room is still "available" today)
    const booking = await request(app)
      .post('/api/v1/reservations')
      .set(auth())
      .set('Idempotency-Key', uid())
      .set('x-test-time', Cairo13)
      .send({
        guest_id: otherGuest,
        room_id: String(room._id),
        check_in: '2026-10-16T12:00:00+03:00',
        check_out: '2026-10-18T12:00:00+03:00',
      });
    expect(booking.status).toBe(201);

    const res = await walkIn(baseBody(room));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    // only the other guest and the other booking exist; nothing from the walk-in
    expect(await Guest.countDocuments({})).toBe(1);
    expect(await Reservation.countDocuments({})).toBe(1);
    expect(await Payment.countDocuments({})).toBe(0);
    const fresh = await Room.findById(room._id);
    expect(fresh.status).toBe('available');
  });

  test('existing id_number (even typed in lower case) returns 409 and nothing is written', async () => {
    const room = await createRoom();
    await createGuestApi({ id_number: 'AB12345678' });

    const res = await walkIn(
      baseBody(room, { new_guest: newGuest({ phone: '01222222222', id_number: 'ab12345678' }) })
    );

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(await Guest.countDocuments({})).toBe(1); // only the old one
    expect(await Reservation.countDocuments({})).toBe(0);
    expect(await Payment.countDocuments({})).toBe(0);
  });

  test('idempotency replay: same key twice executes once and returns the same response', async () => {
    const room = await createRoom();
    const key = uid();
    const body = baseBody(room);

    const first = await walkIn(body, { key });
    const second = await walkIn(body, { key });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(second.body).toEqual(first.body);

    expect(await Guest.countDocuments({})).toBe(1);
    expect(await Reservation.countDocuments({})).toBe(1);
    expect(await Payment.countDocuments({})).toBe(1);
  });

  test('same key with a different payment amount is rejected with 400', async () => {
    const room = await createRoom();
    const key = uid();

    const first = await walkIn(baseBody(room), { key });
    expect(first.status).toBe(201);

    const second = await walkIn(
      baseBody(room, { payment: { amount: 100, payment_method: 'cash' } }),
      { key }
    );
    expect(second.status).toBe(400);
    expect(await Payment.countDocuments({})).toBe(1);
  });

  test('Option B: early arrival before 12:00, full amount including the fee in one go succeeds', async () => {
    const room = await createRoom();
    const res = await walkIn(
      baseBody(room, {
        early_arrival: true,
        payment: { amount: FULL_EARLY, payment_method: 'cash' },
      }),
      { time: Cairo09 }
    );

    expect(res.status).toBe(201);
    const reservation = await Reservation.findOne({});
    expect(reservation.status).toBe('checked_in');
    expect(reservation.early_arrival).toBe(true);
    expect(reservation.total_amount).toBe(toPiastres(FULL_EARLY));
    expect(reservation.paid_cache).toBe(toPiastres(FULL_EARLY));
    const roomDoc = await Room.findById(room._id);
    expect(roomDoc.status).toBe('occupied');
  });

  test('Option B: arriving at 09:00 for today WITHOUT early_arrival returns 409 and rolls back', async () => {
    const room = await createRoom();
    const res = await walkIn(baseBody(room), { time: Cairo09 });

    expect(res.status).toBe(409);
    await expectNothingWritten(room);
  });

  test('validation: guest_id and new_guest together, or no payment, return 400', async () => {
    const room = await createRoom();
    const guest_id = await createGuestApi();

    const both = await walkIn(baseBody(room, { guest_id }));
    expect(both.status).toBe(400);

    const noPayment = baseBody(room);
    delete noPayment.payment;
    const missing = await walkIn(noPayment);
    expect(missing.status).toBe(400);

    expect(await Reservation.countDocuments({})).toBe(0);
  });
});
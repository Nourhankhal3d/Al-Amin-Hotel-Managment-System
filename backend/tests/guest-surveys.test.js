const request = require('supertest');
const argon2 = require('argon2');
const { DateTime } = require('luxon');
const app = require('../src/app');
const { Staff, Shift, Attendance, Room, Guest, Reservation, GuestSurvey, AuditLog } = require('../src/db/models');
const { ZONE, noonCairo } = require('../src/utils/time');
const { toPiastres } = require('../src/utils/money');

describe('Guest Surveys', () => {
  const password = 'Password123';
  const today = '2026-10-15';
  const yesterday = '2026-10-14';
  const NOW = DateTime.fromISO(`${today}T13:00:00`, { zone: ZONE }).toISO();

  let passwordHash;
  let token;
  let reservation;

  beforeAll(async () => {
    passwordHash = await argon2.hash(password);
  });

  beforeEach(async () => {
    await Promise.all([
      Staff.deleteMany({}),
      Shift.deleteMany({}),
      Attendance.deleteMany({}),
      Room.deleteMany({}),
      Guest.deleteMany({}),
      Reservation.deleteMany({}),
      GuestSurvey.deleteMany({}),
      AuditLog.collection.deleteMany({}),
    ]);

    await Staff.create({
      username: 'rec_survey',
      name: 'Rec Survey',
      password_hash: passwordHash,
      default_shift_type: 'morning',
      role: 'receptionist',
      active: true,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('x-test-time', NOW)
      .send({ username: 'rec_survey', password });

    token = loginRes.body.access_token;

    const room = await Room.create({
      room_number: '304',
      room_type: 'double',
      floor: 3,
      price_per_night: toPiastres(1000),
      half_day_price: toPiastres(400),
    });

    const guest = await Guest.create({
      name: 'Test Guest',
      name_search: 'test guest',
      phone: '+201000000001',
      id_number_enc: 'enc',
      id_number_hash: 'hash-1',
      id_number_last4: '0001',
    });

    reservation = await Reservation.create({
      guest_id: guest._id,
      room_id: room._id,
      check_in_at: noonCairo(yesterday),
      check_out_at: noonCairo(today),
      nights: 1,
      status: 'checked_out',
      price_per_night_snapshot: room.price_per_night,
      half_day_price_snapshot: room.half_day_price,
      total_amount: room.price_per_night,
    });
  });

  const ratingsPayload = {
    cleanliness: 5,
    staff: 3,
    speed: 3,
    room_quality: 3,
    check_in: 1,
    check_out: 4,
    stay_again: 3,
    recommend: 4,
  };

  test('computes overall_rating 3.3 from [5,3,3,3,1,4,3,4] even when body sends overall_rating: 5', async () => {
    const res = await request(app)
      .post('/api/v1/guest-surveys')
      .set('Authorization', `Bearer ${token}`)
      .set('x-test-time', NOW)
      .send({
        reservation_id: String(reservation._id),
        ratings: ratingsPayload,
        had_problem: false,
        overall_rating: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.overall_rating).toBe(3.3);
  });

  test('accepts body without overall_rating (201) and returns computed value', async () => {
    const res = await request(app)
      .post('/api/v1/guest-surveys')
      .set('Authorization', `Bearer ${token}`)
      .set('x-test-time', NOW)
      .send({
        reservation_id: String(reservation._id),
        ratings: ratingsPayload,
        had_problem: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.overall_rating).toBe(3.3);
  });
});

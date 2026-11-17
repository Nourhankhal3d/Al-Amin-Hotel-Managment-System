const request = require('supertest');
const argon2 = require('argon2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const { Staff, Session, Setting, Room } = require('../src/db/models');

describe('Feature 12: Manager Settings Endpoints', () => {
  let managerStaff;
  let managerToken;

  const auth = () => ({
    Authorization: `Bearer ${managerToken}`,
  });

  beforeEach(async () => {
    await Promise.all([
      Staff.deleteMany({}),
      Session.deleteMany({}),
      Setting.deleteMany({}),
      Room.deleteMany({}),
    ]);

    managerStaff = await Staff.create({
      username: 'manager_f12',
      name: 'Manager User',
      password_hash: await argon2.hash('Password123'),
      role: 'manager',
      active: true,
      notification_prefs: {
        approval_request: true,
        leave_request: true,
        critical_maintenance: true,
        critical_complaint: true,
        shift_report_submitted: true,
        system: true,
      },
    });

    const session = await Session.create({
      staff_id: managerStaff._id,
      refresh_hash: crypto.randomBytes(32).toString('hex'),
      expires_at: new Date(Date.now() + 24 * 3600 * 1000),
    });

    managerToken = jwt.sign(
      { sub: String(managerStaff._id), sid: String(session._id), role: 'manager' },
      env.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  describe('Hotel Settings', () => {
    test('GET /api/v1/manager/hotel-settings returns hotel settings', async () => {
      const res = await request(app)
        .get('/api/v1/manager/hotel-settings')
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Al-Amin Hotel');
    });

    test('GET /api/v1/hotel-settings returns hotel settings via alias', async () => {
      const res = await request(app)
        .get('/api/v1/hotel-settings')
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    test('PATCH /api/v1/manager/hotel-settings updates hotel settings', async () => {
      const res = await request(app)
        .patch('/api/v1/manager/hotel-settings')
        .set(auth())
        .send({ name: 'New Al-Amin Hotel', location: 'Aswan' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Al-Amin Hotel');
      expect(res.body.data.location).toBe('Aswan');
    });
  });

  describe('Shift Settings', () => {
    test('GET /api/v1/manager/shift-settings returns shift hours', async () => {
      const res = await request(app)
        .get('/api/v1/manager/shift-settings')
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.morning).toBeDefined();
      expect(typeof res.body.data.morning.start).toBe('number');
    });

    test('GET /api/v1/shift-settings returns shift hours via alias', async () => {
      const res = await request(app)
        .get('/api/v1/shift-settings')
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data.morning).toBeDefined();
    });

    test('PATCH /api/v1/manager/shift-settings updates shift hours with valid integers', async () => {
      const res = await request(app)
        .patch('/api/v1/manager/shift-settings')
        .set(auth())
        .send({
          morning: { start: 7, end: 15 },
          evening: { start: 15, end: 23 },
          night: { start: 23, end: 7 },
        });
      expect(res.status).toBe(200);
      expect(res.body.data.morning.end).toBe(15);
      expect(res.body.data.evening.start).toBe(15);
    });
  });

  describe('Notification Preferences', () => {
    test('GET /api/v1/manager/notifications/preferences returns preferences', async () => {
      const res = await request(app)
        .get('/api/v1/manager/notifications/preferences')
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.critical_maintenance).toBe(true);
    });

    test('GET /api/v1/notifications/preferences returns preferences via alias', async () => {
      const res = await request(app)
        .get('/api/v1/notifications/preferences')
        .set(auth());
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.critical_maintenance).toBe(true);
    });

    test('PATCH /api/v1/manager/notifications/preferences updates preferences', async () => {
      const res = await request(app)
        .patch('/api/v1/manager/notifications/preferences')
        .set(auth())
        .send({ critical_maintenance: false });
      expect(res.status).toBe(200);
      expect(res.body.data.critical_maintenance).toBe(false);
    });

    test('PATCH /api/v1/notifications/preferences updates preferences via alias', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/preferences')
        .set(auth())
        .send({ critical_maintenance: false });
      expect(res.status).toBe(200);
      expect(res.body.data.critical_maintenance).toBe(false);
    });
  });
});


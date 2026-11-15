// Tests for Manager Feature M12: hotel settings, shift settings and search

const request = require('supertest');
const app = require('../../src/app');
const { Room, Setting, Staff, ShiftSchedule, ShiftReport } = require('../../src/db/models');
const { makeToken } = require('../helpers/managerAuth');
const {
  validateHours, setShiftHours, getShiftHours, shiftWindow,
} = require('../../src/utils/time');

jest.setTimeout(60000);

describe('Manager Feature M12: Settings and Search', () => {
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const DEFAULTS = {
    morning: { start: 7, end: 16 },
    evening: { start: 16, end: 23 },
    night: { start: 23, end: 7 },
  };
  let mgr;
  let mgrToken;

  beforeEach(async () => {
    await Promise.all([
      Room.deleteMany({}),
      Setting.deleteMany({}),
      ShiftSchedule.deleteMany({}),
      ShiftReport.deleteMany({}),
    ]);
    setShiftHours(DEFAULTS);
    const m = await makeToken('manager');
    mgr = m.staff;
    mgrToken = m.token;
  });

  afterAll(() => {
    setShiftHours(DEFAULTS);
  });

  describe('validateHours', () => {
    it('accepts the defaults', () => {
      expect(validateHours(DEFAULTS)).toBe(true);
    });

    it('rejects a gap', () => {
      expect(validateHours({ ...DEFAULTS, evening: { start: 17, end: 23 } })).toBe(false);
    });

    it('rejects an overlap', () => {
      expect(validateHours({ ...DEFAULTS, morning: { start: 7, end: 17 } })).toBe(false);
    });

    it('rejects start equal to end', () => {
      expect(validateHours({ ...DEFAULTS, morning: { start: 7, end: 7 } })).toBe(false);
    });

    it('rejects non-integer and out-of-range hours', () => {
      expect(validateHours({ ...DEFAULTS, morning: { start: 7.5, end: 16 } })).toBe(false);
      expect(validateHours({ ...DEFAULTS, night: { start: 23, end: 24 } })).toBe(false);
    });

    it('rejects a missing shift', () => {
      expect(validateHours({ morning: DEFAULTS.morning, evening: DEFAULTS.evening })).toBe(false);
    });
  });

  describe('hotel settings', () => {
    it('returns the settings with the live room count', async () => {
      await Setting.create({ key: 'hotel', value: { name: 'Al-Amin', location: 'Cairo', count_floors: 5 } });
      await Room.create({ room_number: '101', room_type: 'single', floor: 1, price_per_night: 100000, half_day_price: 50000 });
      const res = await request(app).get('/api/v1/manager/hotel-settings').set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ name: 'Al-Amin', location: 'Cairo', floors_count: 5, total_rooms: 1 });
    });

    it('updates the settings and stores count_floors', async () => {
      const res = await request(app)
        .patch('/api/v1/manager/hotel-settings')
        .set(auth(mgrToken))
        .send({ name: 'Al-Amin Hotel', floors_count: 8 });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Al-Amin Hotel');
      expect(res.body.data.floors_count).toBe(8);
      const stored = await Setting.findOne({ key: 'hotel' }).lean();
      expect(stored.value.count_floors).toBe(8);
      expect(stored.value.floors_count).toBeUndefined();
    });

    it('rejects floors_count below the highest room floor (400)', async () => {
      await Room.create({ room_number: '701', room_type: 'single', floor: 7, price_per_night: 100000, half_day_price: 50000 });
      const res = await request(app)
        .patch('/api/v1/manager/hotel-settings')
        .set(auth(mgrToken))
        .send({ floors_count: 3 });
      expect(res.status).toBe(400);
      expect(res.text).toContain('VALIDATION_ERROR');
    });

    it('rejects an empty body (400)', async () => {
      const res = await request(app).patch('/api/v1/manager/hotel-settings').set(auth(mgrToken)).send({});
      expect(res.status).toBe(400);
    });
  });

  describe('shift settings', () => {
    it('returns the current hours', async () => {
      const res = await request(app).get('/api/v1/manager/shift-settings').set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(DEFAULTS);
    });

    it('applies a valid change in this process', async () => {
      const res = await request(app)
        .patch('/api/v1/manager/shift-settings')
        .set(auth(mgrToken))
        .send({ morning: { start: 6, end: 16 }, night: { start: 23, end: 6 }, apply_to_future: false });
      expect(res.status).toBe(200);
      expect(getShiftHours().morning).toEqual({ start: 6, end: 16 });
      const stored = await Setting.findOne({ key: 'shifts' }).lean();
      expect(stored.value.morning).toEqual({ start: 6, end: 16 });
    });

    it('rejects a change that leaves a gap (400) and keeps the old hours', async () => {
      const res = await request(app)
        .patch('/api/v1/manager/shift-settings')
        .set(auth(mgrToken))
        .send({ evening: { start: 17, end: 23 } });
      expect(res.status).toBe(400);
      expect(getShiftHours()).toEqual(DEFAULTS);
    });

    it('moves future rows on the old window but leaves manual rows alone', async () => {
      const staff = await Staff.create({
        username: 'rec_m12', password_hash: 'x', name: 'Rec', role: 'receptionist', default_shift_type: 'morning',
      });
      const d = new Date(Date.now() + 5 * 86400e3).toISOString().slice(0, 10);
      const std = shiftWindow(d, 'morning');
      const start = std.startAt || std.start_at;
      const end = std.endAt || std.end_at;
      await ShiftSchedule.create({ staff_id: staff._id, shift_date: d, shift_type: 'morning', start_at: start, end_at: end, status: 'SCHEDULED' });

      const manualDay = new Date(Date.now() + 6 * 86400e3).toISOString().slice(0, 10);
      const manualStart = new Date(Date.now() + 6 * 86400e3);
      await ShiftSchedule.create({
        staff_id: staff._id, shift_date: manualDay, shift_type: 'morning',
        start_at: manualStart, end_at: new Date(manualStart.getTime() + 3600e3), status: 'SCHEDULED',
      });

      const res = await request(app)
        .patch('/api/v1/manager/shift-settings')
        .set(auth(mgrToken))
        .send({ morning: { start: 6, end: 16 }, night: { start: 23, end: 6 } });
      expect(res.status).toBe(200);
      expect(res.body.data.updated_future_shifts).toBe(1);

      const moved = await ShiftSchedule.findOne({ shift_date: d }).lean();
      const newW = shiftWindow(d, 'morning');
      expect(moved.start_at.getTime()).toBe((newW.startAt || newW.start_at).getTime());
      const manual = await ShiftSchedule.findOne({ shift_date: manualDay }).lean();
      expect(manual.start_at.getTime()).toBe(manualStart.getTime());
    });
  });

  describe('search', () => {
    it('finds rooms by prefix and staff by name', async () => {
      await Room.create({ room_number: '305', room_type: 'double', floor: 3, price_per_night: 100000, half_day_price: 50000 });
      await Staff.create({ username: 'sara.m12', password_hash: 'x', name: 'Sara Ali', name_search: 'sara ali', role: 'receptionist', default_shift_type: 'morning' });
      const res = await request(app).get('/api/v1/manager/search?q=30').set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.body.data.rooms.map((r) => r.room_number)).toContain('305');

      const res2 = await request(app).get('/api/v1/manager/search?q=sara').set(auth(mgrToken));
      expect(res2.body.data.staff.map((s) => s.full_name)).toContain('Sara Ali');
    });

    it('finds a shift report by date', async () => {
      await ShiftReport.create({
        shift_id: new (require('mongoose').Types.ObjectId)(), shift_date: '2030-09-09',
        shift_type: 'morning', staff_name: 'Ahmed',
      });
      const res = await request(app).get('/api/v1/manager/search?q=2030-09-09').set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.body.data.shift_reports).toHaveLength(1);
    });
    it('looks up a 14-digit national ID and returns only the masked ID', async () => {
      const { encrypt, blindIndex, normalizeIdNumber } = require('../../src/utils/crypto');
      const id = '29001011234567';
      const norm = normalizeIdNumber(id);
      await Staff.create({
        username: 'idowner.m12', password_hash: 'x', name: 'Id Owner', name_search: 'id owner',
        role: 'receptionist', default_shift_type: 'morning',
        id_number_enc: encrypt(norm), id_number_hash: blindIndex(norm), id_number_last4: norm.slice(-4),
      });

      const res = await request(app).get(`/api/v1/manager/search?q=${id}`).set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.body.data.staff).toHaveLength(1);
      expect(res.body.data.staff[0].full_name).toBe('Id Owner');
      expect(res.body.data.staff[0].national_id.endsWith('4567')).toBe(true);
      // the full number is never returned, and the query is not echoed back
      expect(JSON.stringify(res.body)).not.toContain(id);
      expect(res.body.meta.q).toBeNull();
    });
    it('rejects q of one character (400)', async () => {
      const res = await request(app).get('/api/v1/manager/search?q=a').set(auth(mgrToken));
      expect(res.status).toBe(400);
    });

    it('does not break on regex characters', async () => {
      const res = await request(app).get('/api/v1/manager/search?q=' + encodeURIComponent('.*(')).set(auth(mgrToken));
      expect(res.status).toBe(200);
    });
  });

  describe('access control', () => {
    it('rejects a receptionist token (403) and no token (401)', async () => {
      const { token } = await makeToken('receptionist');
      for (const path of ['/hotel-settings', '/shift-settings', '/search?q=ab']) {
        expect((await request(app).get(`/api/v1/manager${path}`).set(auth(token))).status).toBe(403);
        expect((await request(app).get(`/api/v1/manager${path}`)).status).toBe(401);
      }
    });
  });
});
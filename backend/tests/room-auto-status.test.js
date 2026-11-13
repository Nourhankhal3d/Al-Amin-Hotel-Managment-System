const request = require('supertest');
const argon2 = require('argon2');
const { DateTime } = require('luxon');
const app = require('../src/app');
const {
  Staff,
  Shift,
  Attendance,
  Room,
  CleaningTask,
  MaintenanceIssue,
  RoomStatusHistory,
  AuditLog,
} = require('../src/db/models');
const { ZONE } = require('../src/utils/time');
const { toPiastres } = require('../src/utils/money');

describe('Room status follows cleaning and maintenance requests', () => {
  const password = 'Password123';
  const today = '2026-10-15';
  const Cairo13 = DateTime.fromISO(`${today}T13:00:00`, { zone: ZONE }).toISO();
  let token;

  const auth = () => ({ Authorization: `Bearer ${token}` });

  const createRoom = (status = 'available', room_number = '501') =>
    Room.create({
      room_number,
      room_type: 'deluxe',
      floor: 5,
      price_per_night: toPiastres(1500),
      half_day_price: toPiastres(500),
      status,
    });

  const statusOf = async (room) => (await Room.findById(room._id)).status;

  const openCleaning = (room) =>
    request(app)
      .post('/api/v1/cleaning-tasks')
      .set(auth())
      .set('x-test-time', Cairo13)
      .send({ room_id: String(room._id), priority: 'medium' });

  const openIssue = (room) =>
    request(app)
      .post('/api/v1/maintenance-issues')
      .set(auth())
      .set('x-test-time', Cairo13)
      .send({ room_id: String(room._id), problem: 'AC leak', priority: 'high' });

  const finishCleaning = (taskId) =>
    request(app)
      .patch(`/api/v1/cleaning-tasks/${taskId}`)
      .set(auth())
      .set('x-test-time', Cairo13)
      .send({ status: 'done' });

  const resolveIssue = (issueId) =>
    request(app)
      .patch(`/api/v1/maintenance-issues/${issueId}`)
      .set(auth())
      .set('x-test-time', Cairo13)
      .send({ status: 'resolved' });

  beforeEach(async () => {
    await Promise.all([
      Staff.deleteMany({}),
      Shift.deleteMany({}),
      Attendance.deleteMany({}),
      Room.deleteMany({}),
      CleaningTask.deleteMany({}),
      MaintenanceIssue.deleteMany({}),
      RoomStatusHistory.deleteMany({}),
      AuditLog.collection.deleteMany({}),
    ]);

    await Staff.create({
      username: 'reception_auto',
      name: 'Morning Receptionist',
      password_hash: await argon2.hash(password),
      default_shift_type: 'morning',
      role: 'receptionist',
      active: true,
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .set('x-test-time', Cairo13)
      .send({ username: 'reception_auto', password });
    expect(loginRes.status).toBe(200);
    token = loginRes.body.access_token;
  });

  test('a cleaning request puts an available room in cleaning and writes a history row', async () => {
    const room = await createRoom();
    const res = await openCleaning(room);
    expect(res.status).toBe(201);
    expect(await statusOf(room)).toBe('cleaning');

    const rows = await RoomStatusHistory.find({ room_id: room._id });
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe('cleaning');
  });

  test('a cleaning request on an occupied room is rejected and nothing is saved', async () => {
    const room = await createRoom('occupied');
    const res = await openCleaning(room);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    expect(await CleaningTask.countDocuments({ room_id: room._id })).toBe(0);
    expect(await statusOf(room)).toBe('occupied');
  });

  test('finishing the only cleaning request returns the room to available', async () => {
    const room = await createRoom();
    const created = await openCleaning(room);
    const res = await finishCleaning(created.body.task_id);
    expect(res.status).toBe(200);
    expect(await statusOf(room)).toBe('available');
  });

  test('a maintenance request puts the room in maintenance, resolving returns it to available', async () => {
    const room = await createRoom();
    const created = await openIssue(room);
    expect(created.status).toBe(201);
    expect(await statusOf(room)).toBe('maintenance');

    const res = await resolveIssue(created.body.issue_id);
    expect(res.status).toBe(200);
    expect(await statusOf(room)).toBe('available');
  });

  test('a maintenance request on an occupied room is recorded and the room stays occupied', async () => {
    const room = await createRoom('occupied');
    const res = await openIssue(room);
    expect(res.status).toBe(201);
    expect(await statusOf(room)).toBe('occupied');
    expect(await RoomStatusHistory.countDocuments({ room_id: room._id })).toBe(0);
  });

  test('cleaning finishes first while maintenance is open: room stays in maintenance until resolved', async () => {
    const room = await createRoom();
    const cleaning = await openCleaning(room);
    const issue = await openIssue(room);
    expect(await statusOf(room)).toBe('maintenance');

    await finishCleaning(cleaning.body.task_id);
    expect(await statusOf(room)).toBe('maintenance');

    await resolveIssue(issue.body.issue_id);
    expect(await statusOf(room)).toBe('available');
  });

  test('maintenance resolves first while cleaning is pending: room goes to cleaning, then available', async () => {
    const room = await createRoom();
    const cleaning = await openCleaning(room);
    const issue = await openIssue(room);

    await resolveIssue(issue.body.issue_id);
    expect(await statusOf(room)).toBe('cleaning');

    await finishCleaning(cleaning.body.task_id);
    expect(await statusOf(room)).toBe('available');
  });
});
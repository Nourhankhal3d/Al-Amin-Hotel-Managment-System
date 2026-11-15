// Manager Settings Service (M12): hotel settings and shift settings
const mongoose = require('mongoose');
const { Setting, Room, ShiftSchedule, Shift } = require('../../../db/models');
const { E } = require('../../../utils/errors');
const { sanitizeText } = require('../../../utils/arabic');
const { todayCairo, shiftWindow, getShiftHours, setShiftHours, validateHours } = require('../../../utils/time');
const { audit } = require('../../audit/audit.service');
const { AUDIT } = require('../../audit/audit.actions');

const ORDER = ['morning', 'evening', 'night'];

// shiftWindow may return startAt/endAt or start_at/end_at, so read both
const win = (d, type, hours) => {
  const w = shiftWindow(d, type, hours);
  return { start: w.startAt || w.start_at, end: w.endAt || w.end_at };
};

// ─── Hotel settings ───────────────────────────────────────────────────────

async function readHotel() {
  const doc = await Setting.findOne({ key: 'hotel' }).lean();
  const v = (doc && doc.value) || {};
  return {
    name: v.name ?? null,
    location: v.location ?? null,
    floors_count: v.count_floors ?? null,
    updated_at: doc && doc.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

async function getHotelSettings() {
  const hotel = await readHotel();
  const total_rooms = await Room.countDocuments({});
  return { ...hotel, total_rooms };
}

async function updateHotelSettings(body, actor, ip) {
  const { name, location, floors_count } = body || {};
  if (name === undefined && location === undefined && floors_count === undefined) {
    throw E.validation('At least one of name, location or floors_count is required');
  }

  const set = {};
  if (name !== undefined) {
    const n = sanitizeText(String(name));
    if (n.length < 1 || n.length > 100) {
      throw E.validation('name must be 1-100 characters', { field: 'name' });
    }
    set['value.name'] = n;
  }
  if (location !== undefined) {
    const l = sanitizeText(String(location));
    if (l.length > 200) {
      throw E.validation('location must be at most 200 characters', { field: 'location' });
    }
    set['value.location'] = l;
  }
  if (floors_count !== undefined) {
    if (!Number.isInteger(floors_count) || floors_count < 1 || floors_count > 100) {
      throw E.validation('floors_count must be an integer between 1 and 100', { field: 'floors_count' });
    }
    const top = await Room.findOne({ floor: { $ne: null } }).sort({ floor: -1 }).select('floor').lean();
    const highest = top && Number.isFinite(top.floor) ? top.floor : 0;
    if (floors_count < highest) {
      throw E.validation('floors_count is lower than the highest room floor', {
        field: 'floors_count',
        issue: `>= highest room floor (${highest})`,
      });
    }
    set['value.count_floors'] = floors_count;
  }

  const before = await readHotel();
  await Setting.findOneAndUpdate({ key: 'hotel' }, { $set: set }, { upsert: true, returnDocument: 'after' });
  const after = await getHotelSettings();

  await audit({
    action: AUDIT.UPDATED_HOTEL_SETTINGS,
    actorStaffId: actor._id,
    entity: 'Setting',
    entityId: 'hotel',
    details: { before, after: { name: after.name, location: after.location, floors_count: after.floors_count } },
    ip,
  });

  return after;
}

// ─── Shift settings ───────────────────────────────────────────────────────

async function getShiftSettings() {
  return getShiftHours();
}

async function updateShiftSettings(body, actor, ip) {
  const { apply_to_future = true } = body || {};
  if (typeof apply_to_future !== 'boolean') {
    throw E.validation('apply_to_future must be a boolean', { field: 'apply_to_future' });
  }
  const given = ORDER.filter((k) => body && body[k] !== undefined);
  if (!given.length) {
    throw E.validation('At least one of morning, evening or night is required');
  }

  const oldHours = getShiftHours();
  const merged = JSON.parse(JSON.stringify(oldHours));
  for (const k of given) {
    const { start, end } = body[k] || {};
    merged[k] = { start, end };
  }

  if (!validateHours(merged)) {
    throw E.validation('Shifts must follow each other with no gap or overlap and cover exactly 24 hours');
  }

  await Setting.findOneAndUpdate({ key: 'shifts' }, { $set: { value: merged } }, { upsert: true, returnDocument: 'after' });
  setShiftHours(merged);

  let updated = 0;
  if (apply_to_future) {
    const now = new Date();
    const rows = await ShiftSchedule.find({
      status: 'SCHEDULED',
      shift_date: { $gte: todayCairo() },
      start_at: { $gt: now },
    }).lean();

    // never touch a row that already has a real Shift record
    const real = rows.length
      ? await Shift.find({ shift_date: { $in: [...new Set(rows.map((r) => r.shift_date))] } })
          .select('staff_id shift_date shift_type')
          .lean()
      : [];
    const realKeys = new Set(real.map((s) => `${s.staff_id}|${s.shift_date}|${s.shift_type}`));

    const ops = [];
    for (const r of rows) {
      if (realKeys.has(`${r.staff_id}|${r.shift_date}|${r.shift_type}`)) continue;
      const oldW = win(r.shift_date, r.shift_type, oldHours);
      // only rows that still use the OLD standard window; manual times are left alone
      if (r.start_at.getTime() !== oldW.start.getTime() || r.end_at.getTime() !== oldW.end.getTime()) continue;
      const newW = win(r.shift_date, r.shift_type, merged);
      if (newW.start.getTime() === oldW.start.getTime() && newW.end.getTime() === oldW.end.getTime()) continue;
      ops.push({ updateOne: { filter: { _id: r._id }, update: { $set: { start_at: newW.start, end_at: newW.end } } } });
    }
    if (ops.length) {
      const result = await ShiftSchedule.bulkWrite(ops, { ordered: false });
      updated = result.modifiedCount || 0;
    }
  }

  await audit({
    action: AUDIT.UPDATED_SHIFT_SETTINGS,
    actorStaffId: actor._id,
    entity: 'Setting',
    entityId: 'shifts',
    details: { before: oldHours, after: merged, apply_to_future, updated_future_shifts: updated },
    ip,
  });

  return { ...getShiftHours(), updated_future_shifts: updated };
}

module.exports = { getHotelSettings, updateHotelSettings, getShiftSettings, updateShiftSettings };
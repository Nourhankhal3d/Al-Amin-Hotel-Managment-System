const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const { GuestSurvey, Reservation } = require('../../db/models');
const { E } = require('../../utils/errors');
const { sanitizeText } = require('../../utils/arabic');
const { isObjectId } = require('../../utils/ids');
const { cairoDate, ZONE } = require('../../utils/time');
const { escapeRegex } = require('../guests/guest.utils');
const { audit } = require('../audit/audit.service');
const { AUDIT } = require('../audit/audit.actions');

const RATING_KEYS = ['cleanliness', 'staff', 'speed', 'room_quality', 'check_in', 'check_out', 'stay_again', 'recommend'];
const STATUSES = ['COMPLETED', 'PENDING_REVIEW'];
const isStar = (n) => Number.isInteger(n) && n >= 1 && n <= 5;

function toSurveyDto(s) {
  return {
    survey_id: String(s._id),
    reservation_id: s.reservation_id ? String(s.reservation_id) : null,
    guest_name: s.guest_name,
    room_number: s.room_number,
    room_type: s.room_type || null,
    check_in_date: s.check_in_date || null,
    check_out_date: s.check_out_date || null,
    ratings: s.ratings,
    had_problem: s.had_problem,
    problem_details: s.problem_details || null,
    suggestions: s.suggestions || null,
    overall_rating: s.overall_rating,
    status: s.status,
    created_at: s.created_at ? new Date(s.created_at).toISOString() : null,
  };
}

function todayRange(now) {
  const d = DateTime.fromJSDate(now, { zone: ZONE });
  return { start: d.startOf('day').toJSDate(), end: d.endOf('day').toJSDate() };
}

function validateBody(body) {
  const b = body || {};
  const r = b.ratings;
  if (!r || typeof r !== 'object' || !RATING_KEYS.every((k) => isStar(r[k]))) {
    throw E.validation('Every question needs 1 to 5 stars.');
  }
  if (typeof b.had_problem !== 'boolean') throw E.validation('had_problem must be true or false.');

  let problem = null;
  if (b.had_problem) {
    problem = sanitizeText(typeof b.problem_details === 'string' ? b.problem_details : '');
    if (!problem) throw E.validation('Please describe the problem.');
    if (problem.length > 500) throw E.validation('Text is too long (500 characters max).');
  }

  let suggestions = null;
  if (b.suggestions !== undefined && b.suggestions !== null) {
    if (typeof b.suggestions !== 'string') throw E.validation('suggestions must be text.');
    suggestions = sanitizeText(b.suggestions) || null;
    if (suggestions && suggestions.length > 500) throw E.validation('Text is too long (500 characters max).');
  }

  const status = b.status === undefined ? 'COMPLETED' : b.status;
  if (!STATUSES.includes(status)) throw E.validation('Invalid status.');

  const ratings = {};
  RATING_KEYS.forEach((k) => { ratings[k] = r[k]; });
  const avg = RATING_KEYS.reduce((sum, k) => sum + r[k], 0) / RATING_KEYS.length;
  const overall_rating = Math.round(avg * 10) / 10;
  return { ratings, overall_rating, had_problem: b.had_problem, problem_details: problem, suggestions, status };
}

async function createSurvey({ body, staff, shift, ip, now }) {
  const data = validateBody(body);

  const rid = body && body.reservation_id;
  if (!isObjectId(rid)) throw E.notFound('Stay not found.');

  const reservation = await Reservation.findById(rid)
    .populate('guest_id', 'name')
    .populate('room_id', 'room_number room_type');
  const { start, end } = todayRange(now);
  const isToday = reservation && reservation.check_out_at >= start && reservation.check_out_at <= end;
  if (
    !reservation ||
    !reservation.guest_id ||
    !reservation.room_id ||
    !['checked_in', 'checked_out'].includes(reservation.status) ||
    !isToday
  ) {
    throw E.notFound('Stay not found.');
  }

  if (await GuestSurvey.exists({ reservation_id: reservation._id })) {
    throw E.conflict('This stay already has a survey.');
  }

  let survey;
  try {
    survey = await GuestSurvey.create({
      reservation_id: reservation._id,
      guest_name: reservation.guest_id.name,
      room_number: reservation.room_id.room_number,
      room_type: reservation.room_id.room_type ? String(reservation.room_id.room_type).toLowerCase() : null,
      check_in_date: cairoDate(reservation.check_in_at),
      check_out_date: cairoDate(reservation.check_out_at),
      ...data,
      staff_id: staff._id,
      shift_id: shift._id,
    });
  } catch (err) {
    if (err && err.code === 11000) throw E.conflict('This stay already has a survey.');
    throw err;
  }

  await audit({
    action: AUDIT.SURVEY_CREATED,
    actorStaffId: staff._id,
    entity: 'GuestSurvey',
    entityId: String(survey._id),
    details: { reservation_id: String(reservation._id), overall_rating: data.overall_rating },
    ip,
  });

  return toSurveyDto(survey.toObject());
}

async function listSurveys({ q, page = 1, limit = 20 }) {
  const p = Math.max(1, Number(page) || 1);
  const lim = Math.min(100, Math.max(1, Number(limit) || 20));
  const filter = {};
  const s = typeof q === 'string' ? q.trim() : '';
  if (s) {
    const re = new RegExp(escapeRegex(s), 'i');
    filter.$or = [{ guest_name: re }, { room_number: re }];
  }
  const total = await GuestSurvey.countDocuments(filter);
  const docs = await GuestSurvey.find(filter)
    .sort({ created_at: -1 })
    .skip((p - 1) * lim)
    .limit(lim)
    .lean();
  return { data: docs.map(toSurveyDto), meta: { page: p, limit: lim, total } };
}

async function listDepartingStays({ now }) {
  const { start, end } = todayRange(now);
  const reservations = await Reservation.find({
    check_out_at: mongoose.trusted({ $gte: start, $lte: end }),
    status: mongoose.trusted({ $in: ['checked_in', 'checked_out'] }),
  })
    .populate('guest_id', 'name')
    .populate('room_id', 'room_number room_type')
    .sort({ check_out_at: 1 })
    .lean();

  const ids = reservations.map((r) => r._id);
  const done = await GuestSurvey.find({ reservation_id: mongoose.trusted({ $in: ids }) })
    .select('reservation_id')
    .lean();
  const doneSet = new Set(done.map((d) => String(d.reservation_id)));

  const data = reservations
    .filter((r) => r.guest_id && r.room_id && !doneSet.has(String(r._id)))
    .map((r) => ({
      reservation_id: String(r._id),
      guest_name: r.guest_id.name,
      room_number: r.room_id.room_number,
      room_type: r.room_id.room_type ? String(r.room_id.room_type).toLowerCase() : null,
      check_in_date: cairoDate(r.check_in_at),
      check_out_date: cairoDate(r.check_out_at),
    }));

  return { data, meta: { page: 1, limit: data.length, total: data.length } };
}

module.exports = { createSurvey, listSurveys, listDepartingStays };

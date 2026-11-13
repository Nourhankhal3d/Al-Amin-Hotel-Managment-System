const mongoose = require('mongoose');
const {
  Room,
  RoomNight,
  Reservation,
  Guest,
  RoomStatusHistory,
  CleaningTask,
  Payment,
} = require('../../db/models');
const { createGuest } = require('../guests/guest.service');
const { createPayment } = require('../payments/payment.service');
const { withSession } = require('../../utils/transaction');
const { E } = require('../../utils/errors');
const { isObjectId } = require('../../utils/ids');
const { cairoDate, stayDay, noonCairo, nightsBetween, stayDays } = require('../../utils/time');
const { toEgp } = require('../../utils/money');
const { audit } = require('../audit/audit.service');
const { AUDIT } = require('../audit/audit.actions');
const { computeTotal } = require('./reservation.calc');
const { toReservationDto, toReservationDetailDto } = require('./reservation.dto');
const { paginate } = require('../../utils/paginate');

const isDuplicateKey = (err) => err && err.code === 11000;

// تحويل أي تاريخ لشكل يوم القاهرة، ورفض التاريخ الغلط
function toCairoDay(value, field) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw E.validation(`${field} must be a valid date`);
  return cairoDate(d);
}

async function createReservation({ guest_id, room_id, check_in, check_out, early_arrival = false, staff, ip, now, session: externalSession }) {  const readSession = externalSession || null;

  // a. الضيف والغرفة لازم يكونوا موجودين
  if (!isObjectId(guest_id) || !(await Guest.exists({ _id: guest_id }).session(readSession))) {
    throw E.notFound('Guest not found');
  }
  const room = isObjectId(room_id) ? await Room.findById(room_id).session(readSession).lean() : null;
  if (!room) throw E.notFound('Room not found');

  // b. الأيام والليالي (بتوقيت القاهرة)
  const inDay = toCairoDay(check_in, 'check_in');
  const outDay = toCairoDay(check_out, 'check_out');
  const nights = nightsBetween(inDay, outDay);
  if (nights < 1) throw E.validation('check_out must be at least one day after check_in');
  if (inDay < stayDay(now)) throw E.validation('check_in cannot be in the past');

  // c. الغرفة في الصيانة
  if (room.status === 'maintenance') {
    throw E.conflict('Room is under maintenance');
  }

  // d. الوقت المخزّن دايمًا 12:00 ظهرًا بتوقيت القاهرة
  const check_in_at = noonCairo(inDay);
  const check_out_at = noonCairo(outDay);

  const fields = {
    guest_id,
    room_id: room._id,
    check_in_at,
    check_out_at,
    nights,
    status: 'confirmed',
    price_per_night_snapshot: room.price_per_night,
    half_day_price_snapshot: room.half_day_price,
    half_day_extensions: 0,
      early_arrival: early_arrival === true,
    paid_cache: 0,
  };
  fields.total_amount = computeTotal(fields);

  // e. كله جوه transaction واحدة
  let reservation;
  try {
    reservation = await withSession(externalSession, async (session) => {
      const [created] = await Reservation.create([fields], { session });

      await RoomNight.insertMany(
        stayDays(inDay, nights).map((day) => ({
          room_id: room._id,
          day,
          reservation_id: created._id,
        })),
        { session }
      );

      await audit(
        {
          action: AUDIT.RESERVATION_CREATED,
          actorStaffId: staff._id,
          entity: 'Reservation',
          entityId: String(created._id),
          details: { room_id: String(room._id), guest_id: String(guest_id), check_in: inDay, check_out: outDay, nights },
          ip,
        },
        { session }
      );

      return created;
    });
  } catch (err) {
    // f. الـ unique index على RoomNight منع الحجز المزدوج
    if (isDuplicateKey(err)) throw E.conflict('Room is already booked for these dates');
    throw err;
  }

  return toReservationDto(reservation.toObject());
}

async function resolveReservationForCheckIn(identifier, now = new Date()) {
  if (isObjectId(identifier)) {
    const r = await Reservation.findById(identifier);
    if (r) return r;
  }

  let roomId = isObjectId(identifier) ? identifier : null;
  if (!roomId) {
    const roomDoc = await Room.findOne({ room_number: String(identifier) });
    if (roomDoc) roomId = roomDoc._id;
  }

  if (roomId) {
    const currentStayDay = stayDay(now);
    const todayDate = cairoDate(now);
    const nights = await RoomNight.find({
      room_id: roomId,
      day: { $in: [currentStayDay, todayDate] },
    }).lean();
    if (nights.length) {
      const confirmed = await Reservation.find({
        _id: mongoose.trusted({ $in: nights.map((n) => n.reservation_id) }),
        status: 'confirmed',
      });
      if (confirmed.length === 1) return confirmed[0];
      if (confirmed.length > 1) {
        throw E.conflict(
          'More than one confirmed reservation for this room today. Send reservation_id.',
          'AMBIGUOUS_RESERVATION'
        );
      }
    }
  }

  throw E.notFound('Reservation not found');
}

function resolveArrival(reservation, early_arrival, now) {
  const cNow = cairoDate(now);
  const cCheckIn = cairoDate(reservation.check_in_at);

  if (now >= reservation.check_in_at) {
    if (early_arrival === true) {
      throw E.conflict('Arrival is not early; do not send early_arrival: true');
    }
    return false;
  }
  if (cNow === cCheckIn) {
    if (!early_arrival) {
      throw E.conflict('Guest arrived before scheduled time. Confirm early arrival to proceed.');
    }
    return true;
  }
  throw E.conflict('Too early: change the reservation dates first');
}

async function applyCheckIn({ reservation, room, isEarly, newTotal, staff, shift, now, ip }, session) {
  const resUpd = await Reservation.updateOne(
    { _id: reservation._id, status: 'confirmed' },
    {
      status: 'checked_in',
      check_in_staff_id: staff._id,
      check_in_shift_id: shift._id,
      early_arrival: isEarly,
      total_amount: newTotal,
    },
    { session }
  );
  if (resUpd.modifiedCount !== 1) {
    throw E.conflict('Reservation is no longer confirmed');
  }

  const roomUpd = await Room.updateOne(
    { _id: room._id, status: 'available' },
    { status: 'occupied' },
    { session }
  );
  if (roomUpd.modifiedCount !== 1) {
    throw E.conflict('Room is no longer available');
  }

  await RoomStatusHistory.create(
    [
      {
        room_id: room._id,
        shift_id: shift._id,
        staff_id: staff._id,
        status: 'occupied',
        notes: isEarly ? 'Early check-in' : 'Check-in',
        changed_at: now,
      },
    ],
    { session }
  );

  await audit(
    {
      action: AUDIT.CHECK_IN,
      actorStaffId: staff._id,
      entity: 'Reservation',
      entityId: String(reservation._id),
      details: { room_id: String(room._id), early_arrival: isEarly },
      ip,
    },
    { session }
  );

  return Reservation.findById(reservation._id).session(session);
}

async function checkIn({ reservation_id, early_arrival, staff, shift, ip, now }) {
  const reservation = await resolveReservationForCheckIn(reservation_id, now);

  if (reservation.status !== 'confirmed') {
    throw E.conflict('Reservation is not confirmed');
  }

  const room = await Room.findById(reservation.room_id);
  if (!room) throw E.notFound('Room not found');
  if (room.status !== 'available') {
    throw E.conflict(`Room is not available (current status: ${room.status}). Finish cleaning first.`);
  }

  const isEarly = resolveArrival(reservation, early_arrival, now);

  const newTotal = computeTotal({
    ...reservation.toObject(),
    early_arrival: isEarly,
  });

  if ((reservation.paid_cache || 0) <= 0) {
    throw E.conflict('Record at least one payment before check-in.', 'PAYMENT_REQUIRED');
  }

  let updatedReservation;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      updatedReservation = await applyCheckIn(
        { reservation, room, isEarly, newTotal, staff, shift, now, ip },
        session
      );
    });
  } finally {
    await session.endSession();
  }

  return toReservationDto(updatedReservation.toObject());
}
// Instant walk-in stay: guest (if new) + reservation + first payment + check-in, all in ONE transaction.
async function createWalkInReservation({
  guest_id, new_guest, room_id, check_in, check_out, early_arrival, payment,
  staff, shift, ip, now, idempotencyKey,
}) {
  if (Boolean(guest_id) === Boolean(new_guest)) {
    throw E.validation('Send exactly one of guest_id or new_guest');
  }
  if (!payment) throw E.validation('payment is required');

  const reservationId = await withSession(null, async (session) => {
    // 1. the room must exist and be available right now
    const room = isObjectId(room_id) ? await Room.findById(room_id).session(session).lean() : null;
    if (!room) throw E.notFound('Room not found');
    if (room.status !== 'available') {
      throw E.conflict(`Room is not available (current status: ${room.status}).`);
    }

    // 2. guest: use the existing one or create a new one inside the same transaction
    let guestId = guest_id;
    if (new_guest) {
      const guest = await createGuest(new_guest, staff._id, ip, { session });
      guestId = guest.guest_id;
    }

    // 3. reservation (the early-arrival fee is already inside total_amount)
    const created = await createReservation({
      guest_id: guestId,
      room_id,
      check_in,
      check_out,
      early_arrival: early_arrival === true,
      staff,
      ip,
      now,
      session,
    });

    // 4. arrival rules: same function the normal check-in uses
    const reservation = await Reservation.findById(created.reservation_id).session(session);
    const isEarly = resolveArrival(reservation, early_arrival, now);
    const newTotal = computeTotal({ ...reservation.toObject(), early_arrival: isEarly });

    // 5. first payment (rejects an amount above the remaining amount)
    await createPayment({
      reservation_id: created.reservation_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      notes: payment.notes,
      staff,
      shift,
      ip,
      now,
      idempotencyKey,
      session,
    });

    // 6. check-in: reservation -> checked_in, room -> occupied, history + audit
    await applyCheckIn({ reservation, room, isEarly, newTotal, staff, shift, now, ip }, session);

    return created.reservation_id;
  });

  // read the final result after the transaction is committed
  return getReservation({ reservation_id: reservationId, now });
}
async function resolveReservationForActiveStay(identifier) {
  if (isObjectId(identifier)) {
    const r = await Reservation.findById(identifier);
    if (r) return r;
  }

  let roomId = isObjectId(identifier) ? identifier : null;
  if (!roomId) {
    const roomDoc = await Room.findOne({ room_number: String(identifier) });
    if (roomDoc) roomId = roomDoc._id;
  }

  if (roomId) {
    const checkedIn = await Reservation.findOne({ room_id: roomId, status: 'checked_in' });
    if (checkedIn) return checkedIn;
  }

  throw E.notFound('Reservation not found');
}

async function extendStay({ reservation_id, staff, shift, ip, now }) {
  const reservation = await resolveReservationForActiveStay(reservation_id);

  if (reservation.status !== 'checked_in') {
    throw E.conflict('Reservation is not checked in');
  }

  // تحقق لو فيه حجز تاني بيبدأ يوم الخروج
  const checkoutDay = cairoDate(reservation.check_out_at);
  const conflict = await RoomNight.exists({ room_id: reservation.room_id, day: checkoutDay });
  if (conflict) {
    throw E.conflict('Another booking starts that day');
  }

  const newExtensions = (reservation.half_day_extensions || 0) + 1;
  const newTotal = computeTotal({
    ...reservation.toObject(),
    half_day_extensions: newExtensions,
  });

  let updatedReservation;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const resUpd = await Reservation.updateOne(
        { _id: reservation._id, status: 'checked_in' },
        {
          $inc: { half_day_extensions: 1 },
          total_amount: newTotal,
        },
        { session }
      );
      if (resUpd.modifiedCount !== 1) {
        throw E.conflict('Reservation is no longer checked in');
      }

      await audit(
        {
          action: AUDIT.EXTEND,
          actorStaffId: staff._id,
          entity: 'Reservation',
          entityId: String(reservation._id),
          details: { half_day_extensions: newExtensions },
          ip,
        },
        { session }
      );

      updatedReservation = await Reservation.findById(reservation._id).session(session);
    });
  } finally {
    await session.endSession();
  }

  return toReservationDto(updatedReservation.toObject());
}

async function checkOut({ reservation_id, staff, shift, ip, now }) {
  const reservation = await resolveReservationForActiveStay(reservation_id);

  if (reservation.status !== 'checked_in') {
    throw E.conflict('Reservation is not checked in');
  }

  let updatedReservation;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const resUpd = await Reservation.updateOne(
        {
          _id: reservation._id,
          status: 'checked_in',
         $expr: mongoose.trusted({ $lte: ['$total_amount', '$paid_cache'] }),
        },
        {
          status: 'checked_out',
          check_out_staff_id: staff._id,
          check_out_shift_id: shift._id,
        },
        { session }
      );

      if (resUpd.modifiedCount !== 1) {
        const fresh = await Reservation.findById(reservation._id).session(session);
        if (fresh.status !== 'checked_in') {
          throw E.conflict('Reservation is not checked in');
        }
        const remaining = fresh.total_amount - fresh.paid_cache;
        throw E.conflict(
          `Check-out is blocked: ${toEgp(remaining).toFixed(2)} EGP remaining`,
          'BALANCE_DUE'
        );
      }

      const roomUpd = await Room.updateOne(
        { _id: reservation.room_id, status: 'occupied' },
        { status: 'cleaning' },
        { session }
      );
      if (roomUpd.modifiedCount !== 1) {
        throw E.conflict('Room is not occupied');
      }

      await RoomStatusHistory.create(
        [
          {
            room_id: reservation.room_id,
            shift_id: shift._id,
            staff_id: staff._id,
            status: 'cleaning',
            notes: 'Check-out cleaning',
            changed_at: now,
          },
        ],
        { session }
      );

      await CleaningTask.create(
        [
          {
            room_id: reservation.room_id,
            shift_id: shift._id,
            priority: 'medium',
            status: 'pending',
            cleaner_name: null,
            assigned_by_staff_id: null,
            assigned_at: now,
          },
        ],
        { session }
      );

      await audit(
        {
          action: AUDIT.CHECK_OUT,
          actorStaffId: staff._id,
          entity: 'Reservation',
          entityId: String(reservation._id),
          details: { room_id: String(reservation.room_id) },
          ip,
        },
        { session }
      );

      updatedReservation = await Reservation.findById(reservation._id).session(session);
    });
  } finally {
    await session.endSession();
  }

  return toReservationDto(updatedReservation.toObject());
}

async function resolveReservationByIdentifier(identifier, now = new Date()) {
  if (isObjectId(identifier)) {
    const r = await Reservation.findById(identifier);
    if (r) return r;
  }

  let roomId = isObjectId(identifier) ? identifier : null;
  if (!roomId) {
    const roomDoc = await Room.findOne({ room_number: String(identifier) });
    if (roomDoc) roomId = roomDoc._id;
  }

  if (roomId) {
    // 1. Look for checked-in reservation first
    let r = await Reservation.findOne({ room_id: roomId, status: 'checked_in' });
    if (r) return r;

    // 2. Look for confirmed reservation for current stay day or early arrival today
    const currentStayDay = stayDay(now);
    const todayDate = cairoDate(now);
    const nights = await RoomNight.find({
      room_id: roomId,
      day: { $in: [currentStayDay, todayDate] },
    }).lean();
    if (nights.length) {
      r = await Reservation.findOne({
        _id: mongoose.trusted({ $in: nights.map((n) => n.reservation_id) }),
        status: 'confirmed',
      });
      if (r) return r;
    }
  }

  throw E.notFound('Reservation not found');
}

async function getReservation({ reservation_id, now = new Date() }) {
  const reservation = await resolveReservationByIdentifier(reservation_id, now);
  const [guest, room, payments] = await Promise.all([
    Guest.findById(reservation.guest_id),
    Room.findById(reservation.room_id),
    Payment.find({ reservation_id: reservation._id }).sort({ payment_datetime: -1 }),
  ]);

  return toReservationDetailDto(reservation, { guest, room, payments });
}

async function listReservations({
  status,
  room_id,
  guest_id,
  check_in_from,
  check_in_to,
  page = 1,
  limit = 20,
}) {
  const filter = {};
  if (status) {
    filter.status = status;
  }
  if (guest_id) {
    if (!isObjectId(guest_id)) throw E.validation('Invalid guest_id');
    filter.guest_id = guest_id;
  }
  if (room_id) {
    let targetRoomId = isObjectId(room_id) ? room_id : null;
    if (!targetRoomId) {
      const roomDoc = await Room.findOne({ room_number: String(room_id) });
      if (roomDoc) targetRoomId = roomDoc._id;
      else {
        return {
          data: [],
          meta: { page: Number(page) || 1, limit: Number(limit) || 20, total: 0 },
        };
      }
    }
    filter.room_id = targetRoomId;
  }
  if (check_in_from || check_in_to) {
    filter.check_in_at = {};
    if (check_in_from) {
      filter.check_in_at.$gte = new Date(check_in_from);
    }
    if (check_in_to) {
      filter.check_in_at.$lte = new Date(check_in_to);
    }
  }

  return paginate(
    Reservation,
    filter,
    {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      sort: { createdAt: -1 },
    },
    toReservationDto
  );
}

module.exports = {
  createReservation,
  checkIn,
  extendStay,
  checkOut,
  getReservation,
  listReservations,
  resolveReservationByIdentifier,
  resolveArrival,
  applyCheckIn,
createWalkInReservation,
};

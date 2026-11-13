const { Room, CleaningTask, MaintenanceIssue, RoomStatusHistory } = require('../../db/models');
const { E } = require('../../utils/errors');
const { audit } = require('../audit/audit.service');
const { AUDIT } = require('../audit/audit.actions');
const mongoose = require('mongoose');
// يحسب حالة الغرفة من الطلبات المفتوحة عليها، ويغيّرها لو اختلفت.
// لازم تتنادى جوه transaction (session إجباري).
// - الغرفة المشغولة ما بتتغيرش أبدًا.
// - صيانة مفتوحة (open / in_progress) => maintenance
// - غير كده تنظيف pending => cleaning
// - غير كده => available
async function recomputeRoomStatus({ roomId, staff, shift, now, ip, session, note }) {
  const room = await Room.findById(roomId).session(session);
  if (!room || room.status === 'occupied') return null;

    const openMaintenance = await MaintenanceIssue.exists({
    room_id: room._id,
    status: mongoose.trusted({ $ne: 'resolved' }),
  }).session(session);

  const pendingCleaning = await CleaningTask.exists({
    room_id: room._id,
    status: 'pending',
  }).session(session);

  const target = openMaintenance ? 'maintenance' : pendingCleaning ? 'cleaning' : 'available';
  if (target === room.status) return null;

  const upd = await Room.updateOne(
    { _id: room._id, status: room.status },
    { $set: { status: target } },
    { session }
  );
  if (upd.modifiedCount !== 1) {
    throw E.conflict('Room status was changed by someone else. Please reload.');
  }

  await RoomStatusHistory.create(
    [
      {
        room_id: room._id,
        shift_id: shift ? shift._id : null,
        staff_id: staff._id,
        status: target,
        notes: note || '',
        changed_at: now,
      },
    ],
    { session }
  );

  await audit(
    {
      action: AUDIT.ROOM_STATUS_CHANGED,
      actorStaffId: staff._id,
      entity: 'Room',
      entityId: String(room._id),
      details: { from: room.status, to: target, auto: true },
      ip,
    },
    { session }
  );

  return target;
}

module.exports = { recomputeRoomStatus };
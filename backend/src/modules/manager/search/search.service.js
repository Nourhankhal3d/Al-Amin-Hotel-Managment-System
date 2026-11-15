// Manager Search Service (M12): rooms, staff and shift reports in one call
const { Room, Staff, ShiftReport, Reservation } = require('../../../db/models');
const { E } = require('../../../utils/errors');
const { normalizeArabic } = require('../../../utils/arabic');
const { blindIndex, normalizeIdNumber } = require('../../../utils/crypto');
const { todayCairo } = require('../../../utils/time');
const { toPhysical, occupancyMap } = require('../common/room.mapper');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const idOrNull = (v) => (v ? String(v) : null);

async function search({ q, limit }) {
  const text = typeof q === 'string' ? q.trim() : '';
  if (text.length < 2 || text.length > 50) {
    throw E.validation('q must be 2 to 50 characters', { field: 'q' });
  }
  const lim = limit === undefined ? 5 : Number.parseInt(limit, 10);
  if (!Number.isInteger(lim) || lim < 1 || lim > 10) {
    throw E.validation('limit must be between 1 and 10', { field: 'limit' });
  }

  const [rooms, staff, shift_reports] = await Promise.all([
    searchRooms(text, lim),
    searchStaff(text, lim),
    searchReports(text, lim),
  ]);

  // The query is never echoed back when it is a 14-digit national ID
  const isId = /^\d{14}$/.test(text);
  return { data: { rooms, staff, shift_reports }, meta: { q: isId ? null : text, limit: lim } };
}

async function searchRooms(text, lim) {
  const rx = escapeRegex(text);
  const rows = await Room.find({
    $or: [
      { room_number: { $regex: `^${rx}`, $options: 'i' } },
      { room_type: { $regex: rx, $options: 'i' } },
    ],
  })
    .sort({ room_number: 1 })
    .limit(lim)
    .lean();
  if (!rows.length) return [];

  const occ = await occupancyMap(rows.map((r) => r._id), todayCairo());
  return rows.map((r) => ({
    id: String(r._id),
    room_number: r.room_number,
    floor: r.floor ?? null,
    room_type_name: r.room_type,
    physical_status: toPhysical(r),
    occupancy_status: (occ.get(String(r._id)) || {}).occupancy || 'VACANT',
  }));
}

async function searchStaff(text, lim) {
  let filter;
  if (/^\d{14}$/.test(text)) {
    // National ID: exact lookup by the blind index, never logged, never returned in full
    filter = { id_number_hash: blindIndex(normalizeIdNumber(text)) };
  } else {
    const rx = escapeRegex(text.toLowerCase());
    filter = {
      $or: [
        { name_search: { $regex: escapeRegex(normalizeArabic(text)), $options: 'i' } },
        { username: { $regex: `^${rx}`, $options: 'i' } },
      ],
    };
  }

  const rows = await Staff.find(filter).sort({ name_search: 1 }).limit(lim).lean();
  return rows.map((s) => ({
    id: String(s._id),
    full_name: s.name,
    staff_type: String(s.role).toUpperCase(),
    department: s.department ?? null,
    is_active: s.active !== false,
    national_id: s.id_number_last4 ? `${'*'.repeat(10)}${s.id_number_last4}` : null,
  }));
}

async function searchReports(text, lim) {
  const filter = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? { shift_date: text }
    : { staff_name: { $regex: escapeRegex(text), $options: 'i' } };

  const rows = await ShiftReport.find(filter)
    .select('-pdf -pdf_data')
    .sort({ shift_date: -1, created_at: -1 })
    .limit(lim)
    .lean();

  return rows.map((r) => ({
    report_id: String(r._id),
    business_date: r.shift_date,
    shift_type: r.shift_type,
    staff_name: r.staff_name,
    review_status: r.review_status,
  }));
}

module.exports = { search };
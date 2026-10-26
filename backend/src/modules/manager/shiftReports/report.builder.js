

const ShiftReport = require('../../../db/models/ShiftReport');
const {
  financialsForShifts,
  retainedForShifts,
} = require('../common/finance');

async function saveShiftReport(
  shift,
  {
    notes,
    forced = false,
    session,
    staff,
    pdfBuffer,
    sha256,
    now = new Date(),
  } = {}
) {
  if (!shift?._id) {
    throw new Error('A valid shift is required to save a shift report');
  }

  // Lazy import avoids the circular dependency warning.
  const { buildSummary } = require('../../shifts/shift.service');

  const summary = await buildSummary(shift, session);
  const finance = await financialsForShifts([shift._id], session);
  const retained = await retainedForShifts([shift._id], session);

  const count = (items) => (Array.isArray(items) ? items.length : 0);

  const pendingItems =
    count(summary.pending?.cleaning_tasks) +
    count(summary.pending?.maintenance_issues) +
    count(summary.pending?.unverified_payments);

  const reportNotes = [
    forced ? 'FORCE CLOSED by manager' : null,
    typeof notes === 'string' && notes.trim() ? notes.trim() : null,
  ]
    .filter(Boolean)
    .join('\n');

  const reportData = {
    shift_date: shift.shift_date,
    shift_type: shift.shift_type,
    staff_id: shift.staff_id?._id || shift.staff_id,
    staff_name: staff?.name || shift.staff_name || '',
    handled_rooms: count(summary.rooms_handled),
    tasks_cleaning: count(summary.cleaning_tasks),
    maintenance_requests: count(summary.maintenance_issues),
    pending_items: pendingItems,
    ...finance,
    cancellation_retained_total: retained,

    ...(pdfBuffer
      ? {
          pdf: pdfBuffer,
          pdf_data: pdfBuffer,
          sha256,
          pdf_generated_at: now,
        }
      : {}),
  };

  const options = session ? { session } : {};

  const existing = await ShiftReport.findOne(
    { shift_id: shift._id },
    null,
    options
  );

  if (existing) {
    existing.set(reportData);

    if (reportNotes) {
      existing.notes = [existing.notes, reportNotes]
        .filter(Boolean)
        .join('\n');
    }

    await existing.save(options);
    return existing;
  }

  const [report] = await ShiftReport.create(
    [
      {
        shift_id: shift._id,
        ...reportData,
        created_at: now,
        review_status: 'PENDING_REVIEW',
        notes: reportNotes || null,
      },
    ],
    options
  );

  return report;
}

module.exports = { saveShiftReport };

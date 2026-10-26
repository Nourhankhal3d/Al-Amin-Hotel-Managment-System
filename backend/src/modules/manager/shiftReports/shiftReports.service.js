
const mongoose = require('mongoose');
const {
  ShiftReport,
  Shift,
  AuditLog,
  Staff,
} = require('../../../db/models');
const { E } = require('../../../utils/errors');
const { sanitizeText } = require('../../../utils/arabic');

const REPORT_STATUSES = [
  'PENDING_REVIEW',
  'APPROVED',
  'NEEDS_REVIEW',
];

function validId(id) {
  return mongoose.isValidObjectId(id);
}

async function findReport(id) {
  if (!validId(id)) {
    throw E.notFound('Shift report not found');
  }

  const report = await ShiftReport.findById(id)
    .select('-pdf -pdf_data')
    .lean();

  if (!report) {
    throw E.notFound('Shift report not found');
  }

  return report;
}

async function listReports({
  from,
  to,
  review_status,
  staff_id,
  page = 1,
  limit = 20,
} = {}) {
  const filter = {};

  if (from || to) {
    filter.shift_date = {};
    if (from) filter.shift_date.$gte = from;
    if (to) filter.shift_date.$lte = to;
  }

  if (review_status) {
    if (!REPORT_STATUSES.includes(review_status)) {
      throw E.badRequest('Invalid review_status');
    }
    filter.review_status = review_status;
  }

  if (staff_id) {
    if (!validId(staff_id)) {
      throw E.badRequest('Invalid staff_id');
    }
    filter.staff_id = new mongoose.Types.ObjectId(staff_id);
  }

  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(limit, 10) || 20)
  );

  const [reports, total] = await Promise.all([
    ShiftReport.find(filter)
      .select('-pdf -pdf_data')
      .sort({ shift_date: -1, created_at: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ShiftReport.countDocuments(filter),
  ]);

  return {
    data: reports.map((report) => ({
      report_id: report._id,
      shift_id: report.shift_id,
      business_date: report.shift_date,
      shift_type: report.shift_type,
      staff_id: report.staff_id,
      staff_name: report.staff_name,
      review_status: report.review_status,
      gross_revenue: report.gross_revenue,
      refunds_total: report.refunds_total,
      net_revenue: report.net_revenue,
      created_at: report.created_at,
    })),
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      pages: Math.ceil(total / pageSize),
    },
  };
}

async function getReport(id) {
  return findReport(id);
}

async function getReportActivities(id) {
  const report = await findReport(id);
  const shiftId = String(report.shift_id);

  const activities = await AuditLog.find({
    $or: [
      { entity: 'Shift', entity_id: shiftId },
      { entity: 'ShiftReport', entity_id: String(report._id) },
      { 'details.shift_id': shiftId },
    ],
  })
    .sort({ at: -1 })
    .limit(200)
    .lean();

  return activities;
}

async function getHandover(id) {
  const report = await findReport(id);
  const shift = await Shift.findById(report.shift_id).lean();

  if (!shift) {
    throw E.notFound('Shift not found');
  }

  return {
    report_id: report._id,
    shift_id: shift._id,
    business_date: report.shift_date,
    shift_type: report.shift_type,
    staff_id: report.staff_id,
    staff_name: report.staff_name,
    shift_status: shift.status,
    report_status: shift.report_status,
    handed_over_at: shift.handed_over_at,
    shift_notes: shift.shift_notes,
    pending_items: report.pending_items,
  };
}

async function getReportPdf(id) {
  if (!validId(id)) {
    throw E.notFound('Shift report not found');
  }

  const report = await ShiftReport.findById(id).select('+pdf_data');

  if (!report) {
    throw E.notFound('Shift report not found');
  }

  const pdfBuffer = report.pdf || report.pdf_data;

  if (!pdfBuffer || !pdfBuffer.length) {
    throw E.notFound('PDF is not ready');
  }

  return {
    pdfBuffer,
    filename: `shift-report-${report.shift_date}-${report.shift_type}.pdf`,
  };
}

async function reviewReport(id, body = {}, actor) {
  const report = await findReport(id);

  const status = body.review_status;
  if (!['APPROVED', 'NEEDS_REVIEW'].includes(status)) {
    throw E.badRequest(
      'review_status must be APPROVED or NEEDS_REVIEW'
    );
  }

  if (!actor?._id) {
    throw E.badRequest('Reviewer information is missing');
  }

  const rawComment =
    typeof body.manager_comment === 'string'
      ? body.manager_comment.trim()
      : '';

  const managerComment = rawComment
    ? sanitizeText(rawComment).slice(0, 500)
    : null;

  const updated = await ShiftReport.findByIdAndUpdate(
    id,
    {
      $set: {
        review_status: status,
        reviewed_by_staff_id: actor._id,
        reviewed_at: new Date(),
        manager_comment: managerComment,
      },
    },
    { new: true, runValidators: true }
  ).select('-pdf -pdf_data');

  if (!updated) {
    throw E.notFound('Shift report not found');
  }

  return updated.toObject();
}

module.exports = {
  listReports,
  getReport,
  getReportActivities,
  getHandover,
  getReportPdf,
  reviewReport,
};
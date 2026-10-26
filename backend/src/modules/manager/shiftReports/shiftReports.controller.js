
const service = require('./shiftReports.service');

const actorOf = (req) => req.auth?.staff || req.staff;

async function list(req, res, next) {
  try {
    const { from, to, review_status, staff_id, page, limit } = req.query;
    res.json(await service.listReports({
      from, to, review_status, staff_id, page, limit,
    }));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    res.json({ data: await service.getReport(req.params.id) });
  } catch (err) {
    next(err);
  }
}

async function activities(req, res, next) {
  try {
    res.json({ data: await service.getReportActivities(req.params.id) });
  } catch (err) {
    next(err);
  }
}

async function handover(req, res, next) {
  try {
    res.json({ data: await service.getHandover(req.params.id) });
  } catch (err) {
    next(err);
  }
}

async function pdf(req, res, next) {
  try {
    const result = await service.getReportPdf(req.params.id);
    res.type('application/pdf');
    res.set('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.pdfBuffer);
  } catch (err) {
    next(err);
  }
}


async function review(req, res, next) {
  try {
    res.json({
      data: await service.reviewReport(req.params.id, req.body, actorOf(req)),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, activities, handover, pdf, review };


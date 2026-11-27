const service = require('./guestSurvey.service');
const { getNow } = require('../../utils/clock');

async function create(req, res, next) {
  try {
    const data = await service.createSurvey({
      body: req.body,
      staff: req.auth.staff,
      shift: req.shift,
      ip: req.ip,
      now: getNow(req),
    });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { q, page, limit } = req.query;
    res.json(await service.listSurveys({ q, page, limit }));
  } catch (err) {
    next(err);
  }
}

async function departingStays(req, res, next) {
  try {
    res.json(await service.listDepartingStays({ now: getNow(req) }));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, departingStays };

const service = require('./settings.service');

const actorOf = (req) => req.auth?.staff || req.staff;

async function getHotel(req, res, next) {
  try {
    res.json({ data: await service.getHotelSettings() });
  } catch (err) {
    next(err);
  }
}

async function patchHotel(req, res, next) {
  try {
    res.json({ data: await service.updateHotelSettings(req.body, actorOf(req), req.ip) });
  } catch (err) {
    next(err);
  }
}

async function getShifts(req, res, next) {
  try {
    res.json({ data: await service.getShiftSettings() });
  } catch (err) {
    next(err);
  }
}

async function patchShifts(req, res, next) {
  try {
    res.json({ data: await service.updateShiftSettings(req.body, actorOf(req), req.ip) });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHotel, patchHotel, getShifts, patchShifts };
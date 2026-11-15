const service = require('./search.service');

async function search(req, res, next) {
  try {
    res.json(await service.search({ q: req.query.q, limit: req.query.limit }));
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
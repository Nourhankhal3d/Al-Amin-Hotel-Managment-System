const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { Staff, Session } = require('../db/models');
const { E } = require('../utils/errors');

// نحدّث last_seen_at مرة كل دقيقة بس (مش في كل طلب)
const LAST_SEEN_THROTTLE_MS = 60 * 1000;

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw E.unauthorized('Authentication required');
    }

    const token = authHeader.slice(7).trim();
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch {
      throw E.unauthorized('Invalid or expired token');
    }

    // الجلسة والموظف مستقلين عن بعض (رقم كل واحد جوه الـ token)، فبنجيبهم مع بعض
    const [session, staff] = await Promise.all([
      Session.findById(decoded.sid),
      Staff.findById(decoded.sub),
    ]);

    if (!session || session.revoked_at || session.expires_at <= new Date()) {
      throw E.unauthorized('Session has been revoked or expired');
    }

    if (!staff || !staff.active) {
      throw E.unauthorized('User inactive or not found');
    }

    // تحديث last_seen_at: مرة كل دقيقة، ومن غير ما نستنى النتيجة
    const now = new Date();
    if (!session.last_seen_at || now - session.last_seen_at > LAST_SEEN_THROTTLE_MS) {
      Session.updateOne({ _id: session._id }, { $set: { last_seen_at: now } }).catch(() => {});
    }

    req.auth = {
      staff,
      session,
      role: decoded.role,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
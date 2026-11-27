const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/requireRole');
const requireShift = require('../../middleware/requireShift');
const controller = require('./guestSurvey.controller');

const router = express.Router();

router.use(authenticate);
router.use(requireRole('receptionist'));

router.get('/departing-stays', controller.departingStays);
router.get('/', controller.list);
router.post('/', requireShift, controller.create);

module.exports = router;

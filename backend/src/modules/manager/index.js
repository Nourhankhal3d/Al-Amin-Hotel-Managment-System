const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const requireRole = require('../../middleware/requireRole');

router.use(authenticate, requireRole('manager', 'admin'));

router.use('/password-reset-requests', require('./passwords/password.routes'));
router.use('/notifications', require('./notifications/notifications.routes'));
router.use('/staff', require('./staff/staff.routes'));
router.use('/shifts', require('./shifts/shifts.routes'));
router.use('/rooms', require('./rooms/rooms.routes'));
router.use('/room-types', require('./roomTypes/roomTypes.routes'));
router.use('/housekeeping-tasks', require('./housekeeping/housekeeping.routes'));
router.use('/dashboard', require('./dashboard/dashboard.routes'));
router.use('/activities', require('./activities/activities.routes'));
router.use('/leave-requests', require('./leaves/leave.routes'));
router.use('/approvals', require('./approvals/approvals.routes'));
router.use('/shift-reports', require('./shiftReports/shiftReports.routes'));
router.use('/daily-closings', require('./finance/dailyClosings.routes'));
router.use('/payments', require('./finance/payments.routes'));
const settings = require('./settings/settings.routes');
router.use('/hotel-settings', settings.hotel);
router.use('/shift-settings', settings.shifts);
router.use('/shift-settings', settings.shifts);
router.use('/search', require('./search/search.routes'));

module.exports = router;

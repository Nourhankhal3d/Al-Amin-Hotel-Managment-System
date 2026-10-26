
const router = require('express').Router();
const controller = require('./shiftReports.controller');

router.get('/', controller.list);
router.get('/:id/activities', controller.activities);
router.get('/:id/handover', controller.handover);
router.get('/:id/pdf', controller.pdf);
router.get('/:id', controller.getById);
router.patch('/:id/review', controller.review);

module.exports = router;

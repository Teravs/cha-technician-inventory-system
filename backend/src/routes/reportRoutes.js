const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('SUPER_ADMIN', 'KEPALA'));

router.get('/weekly', reportController.getWeeklyReport);
router.get('/weekly/pdf', reportController.exportWeeklyPdf);
router.get('/monthly/pdf', reportController.exportMonthlyPdf);

module.exports = router;
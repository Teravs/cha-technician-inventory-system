const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', unitController.getAllUnits);
router.post('/', authorize('SUPER_ADMIN'), unitController.createUnit);
router.put('/:id', authorize('SUPER_ADMIN'), unitController.updateUnit);
router.patch('/:id/toggle-status', authorize('SUPER_ADMIN'), unitController.toggleUnitStatus);

module.exports = router;
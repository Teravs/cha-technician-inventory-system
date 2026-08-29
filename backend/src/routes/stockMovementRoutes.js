const express = require('express');
const router = express.Router();
const stockMovementController = require('../controllers/stockMovementController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('SUPER_ADMIN', 'KEPALA'));

router.get('/', stockMovementController.getAllMovements);

module.exports = router;
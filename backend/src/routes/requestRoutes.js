const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', requestController.getRequests);
router.get('/:id', requestController.getRequestById);
router.post('/', authorize('STAFF'), requestController.createRequest);
router.patch('/:id/approve', authorize('KEPALA'), requestController.approveRequest);
router.patch('/:id/reject', authorize('KEPALA'), requestController.rejectRequest);

module.exports = router;
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', itemController.getAllItems);
router.get('/:id', itemController.getItemById);
router.post('/', authorize('SUPER_ADMIN', 'KEPALA'), itemController.createItem);
router.put('/:id', authorize('SUPER_ADMIN', 'KEPALA'), itemController.updateItem);
router.post('/:id/adjust', authorize('SUPER_ADMIN', 'KEPALA'), itemController.adjustStock);
router.delete('/:id', authorize('SUPER_ADMIN', 'KEPALA'), itemController.deleteItem);

module.exports = router;
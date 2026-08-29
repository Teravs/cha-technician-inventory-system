const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', categoryController.getAllCategories);
router.post('/', authorize('SUPER_ADMIN'), categoryController.createCategory);
router.put('/:id', authorize('SUPER_ADMIN'), categoryController.updateCategory);
router.patch('/:id/toggle-status', authorize('SUPER_ADMIN'), categoryController.toggleCategoryStatus);

module.exports = router;
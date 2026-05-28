const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', asyncHandler(userController.getAll));
router.put('/:id/role', asyncHandler(userController.updateRole));
router.delete('/:id', asyncHandler(userController.remove));

module.exports = router;

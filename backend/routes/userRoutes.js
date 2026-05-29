const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadProfile } = require('../middleware/upload');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', asyncHandler(userController.getAll));
router.put('/:id/profile', asyncHandler(userController.updateProfile));
router.post('/:id/photo', uploadProfile.single('photo'), asyncHandler(userController.uploadPhoto));
router.delete('/:id/photo', asyncHandler(userController.deletePhoto));
router.put('/:id/role', asyncHandler(userController.updateRole));
router.delete('/:id', asyncHandler(userController.remove));

module.exports = router;

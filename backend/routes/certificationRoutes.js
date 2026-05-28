const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const certificationController = require('../controllers/certificationController');
const upload = require('../config/upload');

const router = express.Router();

router.get('/', asyncHandler(certificationController.getAll));
router.post('/', upload.single('image'), asyncHandler(certificationController.create));
router.delete('/:id', asyncHandler(certificationController.remove));

module.exports = router;

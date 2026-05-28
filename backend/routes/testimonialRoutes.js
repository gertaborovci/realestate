const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const testimonialController = require('../controllers/testimonialController');

const router = express.Router();

router.get('/', asyncHandler(testimonialController.getAll));
router.post('/', asyncHandler(testimonialController.create));

module.exports = router;

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const inquiryController = require('../controllers/inquiryController');

const router = express.Router();

router.get('/', asyncHandler(inquiryController.getAll));
router.post('/', asyncHandler(inquiryController.create));
router.put('/:id/reply', asyncHandler(inquiryController.reply));

module.exports = router;

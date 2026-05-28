const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const searchAlertController = require('../controllers/searchAlertController');

const router = express.Router();

router.get('/', asyncHandler(searchAlertController.getAll));
router.post('/', asyncHandler(searchAlertController.create));

module.exports = router;

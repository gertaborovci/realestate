const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.get('/', asyncHandler(reviewController.getAll));
router.get('/agent/:agent_id', asyncHandler(reviewController.getByAgent));
router.post('/', asyncHandler(reviewController.create));

module.exports = router;

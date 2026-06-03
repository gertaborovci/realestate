const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

router.get('/',                 asyncHandler(reviewController.getAll));         // public
router.get('/agent/:agent_id',  asyncHandler(reviewController.getByAgent));     // public
router.post('/',                requireRole('admin', 'agent', 'user'), asyncHandler(reviewController.create));
router.put('/:id',              requireRole('admin', 'agent', 'user'), asyncHandler(reviewController.update));
router.delete('/:id',           requireRole('admin'),                  asyncHandler(reviewController.remove));

module.exports = router;

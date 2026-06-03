const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/inquiryController');

const router = express.Router();

router.get('/',                requireRole('admin'),         asyncHandler(c.getAll));
router.get('/agent/:agent_id', requireRole('admin', 'agent'), asyncHandler(c.getByAgent));
router.post('/',               asyncHandler(c.create));        // public — anyone can send a message to an agent
router.put('/:id',             requireRole('admin', 'agent'),        asyncHandler(c.update));
router.put('/:id/reply',       requireRole('admin', 'agent'),        asyncHandler(c.reply));
router.put('/:id/status',      requireRole('admin', 'agent'),        asyncHandler(c.updateStatus));
router.delete('/:id',          requireRole('admin'),                  asyncHandler(c.remove));

module.exports = router;

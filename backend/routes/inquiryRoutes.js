const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const c = require('../controllers/inquiryController');

const router = express.Router();

router.get('/',                asyncHandler(c.getAll));
router.get('/agent/:agent_id', asyncHandler(c.getByAgent));
router.post('/',               asyncHandler(c.create));
router.put('/:id',             asyncHandler(c.update));
router.put('/:id/reply',       asyncHandler(c.reply));
router.put('/:id/status',      asyncHandler(c.updateStatus));
router.delete('/:id',          asyncHandler(c.remove));

module.exports = router;

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const c      = require('../controllers/certificationController');
const upload = require('../config/upload');

const router = express.Router();

// Admin sees all certifications
router.get('/',                requireRole('admin'),          asyncHandler(c.getAll));

// Agent sees their own (before /:id)
router.get('/agent/:agent_id', requireRole('admin', 'agent'), asyncHandler(c.getByAgent));

// Agent submits a certification document
router.post('/',   requireRole('admin', 'agent'), upload.single('image'), asyncHandler(c.create));

// Agent edits their own (type/file); admin can also change status/rejection
router.put('/:id', requireRole('admin', 'agent'), upload.single('image'), asyncHandler(c.update));

// Agent deletes their own; admin deletes any
router.delete('/:id', requireRole('admin', 'agent'),                      asyncHandler(c.remove));

module.exports = router;

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

// Admin approves / rejects
router.put('/:id', requireRole('admin'),          upload.single('image'), asyncHandler(c.update));

// Admin deletes
router.delete('/:id', requireRole('admin'),                               asyncHandler(c.remove));

module.exports = router;

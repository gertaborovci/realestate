const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/officeController');

const router = express.Router();

// Admin: all offices including inactive (before GET /)
router.get('/all',    requireRole('admin'), asyncHandler(c.getAllAdmin));

// Public: only active offices
router.get('/',     asyncHandler(c.getAll));
router.get('/:id',  asyncHandler(c.getById));

// Admin-only: create, update, delete
router.post('/',      requireRole('admin'), asyncHandler(c.create));
router.put('/:id',    requireRole('admin'), asyncHandler(c.update));
router.delete('/:id', requireRole('admin'), asyncHandler(c.remove));

module.exports = router;

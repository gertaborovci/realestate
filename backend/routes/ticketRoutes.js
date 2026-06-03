const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/ticketController');

const router = express.Router();

// Admin: see all tickets
router.get('/', requireRole('admin'), asyncHandler(c.getAll));

// User can read their own tickets (before /:id to avoid collision)
router.get('/user/:user_id', requireRole('admin', 'agent', 'user'), asyncHandler(c.getByUser));

// Single ticket
router.get('/:id',    requireRole('admin', 'agent', 'user'), asyncHandler(c.getById));

// Any authenticated user can open a ticket
router.post('/',      requireRole('admin', 'agent', 'user'), asyncHandler(c.create));

// Admin replies/closes; users can edit their own open tickets
router.put('/:id',    requireRole('admin', 'agent', 'user'), asyncHandler(c.update));

// Admin deletes; users can delete their own open tickets
router.delete('/:id', requireRole('admin', 'agent', 'user'), asyncHandler(c.remove));

module.exports = router;

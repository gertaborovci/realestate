const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const c = require('../controllers/notificationController');

const router = express.Router();

// User-scoped routes (must come before /:id to avoid collisions)
router.get('/user/:user_id',              asyncHandler(c.getByUser));
router.get('/user/:user_id/unread-count', asyncHandler(c.getUnreadCount));
router.put('/user/:user_id/read-all',     asyncHandler(c.markAllRead));
router.delete('/user/:user_id/clear-all', asyncHandler(c.clearAll));

// Broadcast (admin)
router.post('/broadcast', asyncHandler(c.broadcast));

// All notifications — admin view (before /:id)
router.get('/', asyncHandler(c.getAll));

// Single notification CRUD
router.post('/',        asyncHandler(c.create));
router.put('/:id/read', asyncHandler(c.markRead));
router.put('/:id',      asyncHandler(c.update));
router.delete('/:id',   asyncHandler(c.remove));

module.exports = router;

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/notificationController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notifications for users
 *
 * /api/notifications/user/{user_id}:
 *   get:
 *     summary: Get notifications for a specific user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Notification' }
 *
 * /api/notifications/broadcast:
 *   post:
 *     summary: Admin — broadcast a notification to all users
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               title:   { type: string }
 *               message: { type: string }
 *               link:    { type: string }
 *     responses:
 *       200: { description: Broadcast sent }
 *
 * /api/notifications/{id}:
 *   put:
 *     summary: Admin — edit a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 */

// User-scoped routes — any authenticated user reads their own notifications
router.get('/user/:user_id',              requireRole('admin', 'agent', 'user'), asyncHandler(c.getByUser));
router.get('/user/:user_id/unread-count', requireRole('admin', 'agent', 'user'), asyncHandler(c.getUnreadCount));
router.put('/user/:user_id/read-all',     requireRole('admin', 'agent', 'user'), asyncHandler(c.markAllRead));
router.delete('/user/:user_id/clear-all', requireRole('admin', 'agent', 'user'), asyncHandler(c.clearAll));

// Admin-only: broadcast to all users
router.post('/broadcast', requireRole('admin'), asyncHandler(c.broadcast));

// Admin-only: full list of all notifications
router.get('/', requireRole('admin'), asyncHandler(c.getAll));

// Admin-only: create single notification, edit, delete
router.post('/',        requireRole('admin'),                  asyncHandler(c.create));
router.put('/:id/read', requireRole('admin', 'agent', 'user'), asyncHandler(c.markRead));
router.put('/:id',      requireRole('admin'),                  asyncHandler(c.update));
router.delete('/:id',   requireRole('admin', 'agent', 'user'), asyncHandler(c.remove));

module.exports = router;

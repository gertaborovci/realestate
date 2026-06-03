const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const { uploadProfile } = require('../middleware/upload');
const userController = require('../controllers/userController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User account management
 *
 * /api/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       401: { description: Unauthenticated }
 *       403: { description: Forbidden }
 *
 * /api/users/{id}/role:
 *   put:
 *     summary: Change a user's role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, agent, user] }
 *     responses:
 *       200: { description: Role updated }
 *       404: { description: User not found }
 *
 * /api/users/{id}:
 *   get:
 *     summary: Get a single user by ID (any authenticated user)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       404: { description: Not found }
 *   delete:
 *     summary: Delete a user account (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 *
 * /api/users/{id}/profile:
 *   put:
 *     summary: Update own profile (authenticated user)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               phone:    { type: string }
 *     responses:
 *       200: { description: Profile updated }
 */

// Admin-only: list all users, change roles, delete accounts
router.get('/',         requireRole('admin'),                   asyncHandler(userController.getAll));
router.put('/:id/role', requireRole('admin'),                   asyncHandler(userController.updateRole));
router.delete('/:id',   requireRole('admin'),                   asyncHandler(userController.remove));

// Any authenticated user: get single user profile
router.get('/:id',      requireRole('admin', 'agent', 'user'), asyncHandler(userController.getById));

// Authenticated users: update own profile / photo
router.put('/:id/profile',  requireRole('admin', 'agent', 'user'),                                asyncHandler(userController.updateProfile));
router.post('/:id/photo',   requireRole('admin', 'agent', 'user'), uploadProfile.single('photo'), asyncHandler(userController.uploadPhoto));
router.delete('/:id/photo', requireRole('admin', 'agent', 'user'),                               asyncHandler(userController.deletePhoto));

module.exports = router;

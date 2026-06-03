const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const userController = require('../controllers/userController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration, login, and token management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: "John Doe" }
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role:     { type: string, enum: [buyer, agent], default: buyer }
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       409:
 *         description: Email already registered
 */
router.post('/register', asyncHandler(userController.register));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in and receive access + refresh tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', asyncHandler(userController.login));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Exchange a refresh token for a new access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:        { type: string }
 *                 refreshToken: { type: string }
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', asyncHandler(userController.refresh));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out (client must clear stored tokens)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', asyncHandler(userController.logout));

module.exports = router;

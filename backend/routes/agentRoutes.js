const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const agentController = require('../controllers/agentController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: Real-estate agent profiles
 *
 * /api/agents:
 *   get:
 *     summary: List all active agents (with ratings & certifications)
 *     tags: [Agents]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated agent list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:  { type: array, items: { $ref: '#/components/schemas/Agent' } }
 *                 total: { type: integer }
 *                 page:  { type: integer }
 *                 pages: { type: integer }
 *   post:
 *     summary: Create an agent profile (admin only)
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, license_number]
 *             properties:
 *               user_id:               { type: integer }
 *               license_number:        { type: string }
 *               specialization:        { type: string }
 *               commission_percentage: { type: number, minimum: 0, maximum: 100 }
 *               zone:                  { type: string }
 *               status:                { type: string, enum: [Active, Inactive] }
 *               bio:                   { type: string }
 *               phone:                 { type: string }
 *     responses:
 *       201: { description: Agent created }
 *       400: { description: Validation error }
 *       401: { description: Unauthenticated }
 *       403: { description: Forbidden }
 *
 * /api/agents/{id}:
 *   get:
 *     summary: Get a single agent by ID
 *     tags: [Agents]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:  { description: Agent object }
 *       404:  { description: Not found }
 *   put:
 *     summary: Update an agent (admin only)
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *   delete:
 *     summary: Delete an agent (admin only)
 *     tags: [Agents]
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
 * /api/agents/by-user/{user_id}:
 *   get:
 *     summary: Resolve an agent record by user ID
 *     tags: [Agents]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:  { description: Agent object }
 *       404:  { description: Not found }
 */

router.get('/',                   asyncHandler(agentController.getAll));
router.get('/by-user/:user_id',   asyncHandler(agentController.getByUserId)); // must be before /:id
router.get('/:id',                asyncHandler(agentController.getById));
router.post('/',      requireRole('admin'), asyncHandler(agentController.create));
router.put('/:id',    requireRole('admin'), asyncHandler(agentController.update));
router.delete('/:id', requireRole('admin'), asyncHandler(agentController.remove));

module.exports = router;

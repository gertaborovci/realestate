const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const c = require('../controllers/contractController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Contracts
 *   description: Property sale / rental contracts
 *
 * /api/contracts:
 *   get:
 *     summary: List all contracts (admin / agent / buyer)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of contracts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Contract' }
 *   post:
 *     summary: Create a contract (admin / agent)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [property_id, user_id, agent_id, contract_type, price, start_date]
 *             properties:
 *               property_id:   { type: integer }
 *               user_id:       { type: integer }
 *               agent_id:      { type: integer }
 *               contract_type: { type: string, enum: [sale, rent] }
 *               price:         { type: number, minimum: 0 }
 *               start_date:    { type: string, format: date }
 *               end_date:      { type: string, format: date }
 *               notes:         { type: string }
 *     responses:
 *       201: { description: Contract created }
 *       400: { description: Validation error }
 *
 * /api/contracts/{id}:
 *   get:
 *     summary: Get a single contract
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Contract object }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a contract (admin / agent)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete a contract (admin only)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 *
 * /api/contracts/{id}/status:
 *   put:
 *     summary: Update contract status (admin / agent)
 *     tags: [Contracts]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [draft, active, signed, expired, cancelled] }
 *     responses:
 *       200: { description: Status updated }
 *
 * /api/contracts/{id}/sign:
 *   put:
 *     summary: Mark contract as signed
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Signed }
 */

// Read access: admin, agent, and user (buyer)
router.get('/',                      requireRole('admin', 'agent', 'user'), asyncHandler(c.getAll));
router.get('/agent/:agent_id',       requireRole('admin', 'agent'),         asyncHandler(c.getByAgent));
router.get('/buyer/:user_id',        requireRole('admin', 'agent', 'user'), asyncHandler(c.getByBuyer));
router.get('/property/:property_id', requireRole('admin', 'agent', 'user'), asyncHandler(c.getByProperty));
router.get('/:id',                   requireRole('admin', 'agent', 'user'), asyncHandler(c.getOne));

// Write access: admin and agent only
router.post('/',          requireRole('admin', 'agent', 'user'), asyncHandler(c.create));
router.put('/:id',        requireRole('admin', 'agent'),         asyncHandler(c.update));
router.put('/:id/status', requireRole('admin', 'agent'),         asyncHandler(c.updateStatus));
router.put('/:id/sign',   requireRole('admin', 'agent', 'user'), asyncHandler(c.markSigned));
router.put('/:id/notes',  requireRole('admin', 'agent'),         asyncHandler(c.updateNotes));
router.delete('/:id',     requireRole('admin'),                  asyncHandler(c.remove));

module.exports = router;

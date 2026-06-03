const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Financial transactions linked to contracts
 *
 * /api/transactions:
 *   get:
 *     summary: List all transactions (admin / agent)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:          { type: integer }
 *                   contract_id: { type: integer }
 *                   amount:      { type: number }
 *                   status:      { type: string }
 *                   method:      { type: string }
 *                   created_at:  { type: string, format: date-time }
 *   post:
 *     summary: Record a new transaction (admin / agent)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contract_id, amount]
 *             properties:
 *               contract_id: { type: integer }
 *               amount:      { type: number, minimum: 0 }
 *               status:      { type: string, enum: [pending, completed, failed, refunded] }
 *               method:      { type: string }
 *               notes:       { type: string }
 *     responses:
 *       201: { description: Transaction created }
 *       400: { description: Validation error }
 *
 * /api/transactions/{id}:
 *   put:
 *     summary: Update a transaction (admin / agent)
 *     tags: [Transactions]
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
 *     summary: Delete a transaction (admin only)
 *     tags: [Transactions]
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
 * /api/transactions/{id}/status:
 *   put:
 *     summary: Update transaction status only
 *     tags: [Transactions]
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
 *               status: { type: string, enum: [pending, completed, failed, refunded] }
 *     responses:
 *       200: { description: Status updated }
 */

router.get('/',                      requireRole('admin', 'agent'), asyncHandler(transactionController.getAll));
router.get('/agent/:agent_id',       requireRole('admin', 'agent'), asyncHandler(transactionController.getByAgent));
router.get('/contract/:contract_id', requireRole('admin', 'agent', 'user'), asyncHandler(transactionController.getByContract));
router.post('/',                     requireRole('admin', 'agent'), asyncHandler(transactionController.create));
router.put('/:id/status',            requireRole('admin', 'agent'), asyncHandler(transactionController.updateStatus)); // named before /:id
router.put('/:id',                   requireRole('admin', 'agent'), asyncHandler(transactionController.update));       // full update
router.delete('/:id',                requireRole('admin'),          asyncHandler(transactionController.remove));

module.exports = router;

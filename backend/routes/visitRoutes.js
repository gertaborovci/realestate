const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const visitController = require('../controllers/visitController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Visits
 *   description: Property visit / consultation scheduling
 *
 * /api/visits:
 *   get:
 *     summary: Get all visits (admin only)
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of visits
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:          { type: integer }
 *                   property_id: { type: integer }
 *                   user_id:     { type: integer }
 *                   agent_id:    { type: integer }
 *                   visit_date:  { type: string, format: date-time }
 *                   status:      { type: string }
 *                   notes:       { type: string }
 *   post:
 *     summary: Schedule a visit
 *     tags: [Visits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [property_id, visit_date]
 *             properties:
 *               property_id: { type: integer }
 *               user_id:     { type: integer }
 *               agent_id:    { type: integer }
 *               visit_date:  { type: string, format: date-time }
 *               notes:       { type: string }
 *     responses:
 *       201: { description: Visit scheduled }
 *       400: { description: Validation error }
 *
 * /api/visits/{id}:
 *   put:
 *     summary: Update a visit (admin / agent / user)
 *     tags: [Visits]
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
 *     summary: Cancel / delete a visit
 *     tags: [Visits]
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
 */

router.get('/',                                     asyncHandler(visitController.getAll));
router.get('/user/:user_id',                        asyncHandler(visitController.getByUser));
router.get('/agent/:agent_id',                      asyncHandler(visitController.getByAgent));
router.get('/agent/:agent_id/consultations',        asyncHandler(visitController.getConsultationsByAgent));
router.get('/property/:property_id',                asyncHandler(visitController.getByProperty));
router.get('/:id',                                  asyncHandler(visitController.getById));
router.post('/',      requireRole('admin', 'agent', 'user'), asyncHandler(visitController.create));
router.put('/:id',    requireRole('admin', 'agent', 'user'), asyncHandler(visitController.update));
router.delete('/:id', requireRole('admin', 'agent', 'user'), asyncHandler(visitController.remove));

module.exports = router;

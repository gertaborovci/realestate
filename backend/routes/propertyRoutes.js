const express = require('express');
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');
const propertyController = require('../controllers/propertyController');
const imageController = require('../controllers/imageController');
const upload = require('../config/upload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Property listings CRUD
 */

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties (with agent and neighborhood info)
 *     tags: [Properties]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [BUY, RENT] }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Property' }
 *   post:
 *     summary: Create a new property listing
 *     tags: [Properties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Property' }
 *     responses:
 *       201:
 *         description: Property created
 *       400:
 *         description: Validation error
 *
 * /api/properties/{id}:
 *   get:
 *     summary: Get a single property by ID
 *     tags: [Properties]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Property object
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Property' }
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete a property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 */

// ── Property CRUD ──────────────────────────────────────────────────────────
router.get('/',    asyncHandler(propertyController.getAll));                                       // public
router.post('/',   requireRole('admin', 'agent'), asyncHandler(propertyController.create));        // admin/agent

router.get('/agent/:agentId', asyncHandler(propertyController.getByAgent));                        // public, before /:id

// ── Image routes ───────────────────────────────────────────────────────────
router.get('/:id/images',                asyncHandler(imageController.getByProperty));                                          // public
router.post('/:id/images',               requireRole('admin', 'agent'), upload.single('image'), asyncHandler(imageController.upload));
router.delete('/images/:image_id',       requireRole('admin', 'agent'), asyncHandler(imageController.remove));
router.put('/images/:image_id/set-main', requireRole('admin', 'agent'), asyncHandler(imageController.setMain));

// ── Feature routes (merged from featureRoutes.js) ─────────────────────────
router.get('/:id/features', asyncHandler(async (req, res) => {                                     // public
  const [results] = await db.query('SELECT * FROM propertyfeatures WHERE property_id = ?', [req.params.id]);
  res.status(200).json(results);
}));

router.post('/:id/features', requireRole('admin', 'agent'), asyncHandler(async (req, res) => {
  const { emertimi, vlera } = req.body;
  const [result] = await db.query(
    'INSERT INTO propertyfeatures (property_id, emertimi, vlera) VALUES (?, ?, ?)',
    [req.params.id, emertimi, vlera]
  );
  res.status(201).json({ message: 'Feature added successfully.', id: result.insertId });
}));

router.put('/features/:feature_id', requireRole('admin', 'agent'), asyncHandler(async (req, res) => {
  const { emertimi, vlera } = req.body;
  await db.query('UPDATE propertyfeatures SET emertimi = ?, vlera = ? WHERE id = ?', [emertimi, vlera, req.params.feature_id]);
  res.status(200).json({ message: 'Feature updated successfully.' });
}));

router.delete('/features/:feature_id', requireRole('admin', 'agent'), asyncHandler(async (req, res) => {
  await db.query('DELETE FROM propertyfeatures WHERE id = ?', [req.params.feature_id]);
  res.status(200).json({ message: 'Feature deleted successfully.' });
}));

// ── Single property (must be last to avoid swallowing named routes) ────────
router.get('/:id',    asyncHandler(propertyController.getById));                                   // public
router.put('/:id',    requireRole('admin', 'agent'), asyncHandler(propertyController.update));
router.delete('/:id', requireRole('admin'),          asyncHandler(propertyController.remove));

module.exports = router;
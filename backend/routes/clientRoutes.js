const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireRole } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Client / buyer records managed by agents
 *
 * /api/clients:
 *   get:
 *     summary: List all clients (admin / agent)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:             { type: integer }
 *                   emri:           { type: string }
 *                   mbiemri:        { type: string }
 *                   telefoni:       { type: string }
 *                   email:          { type: string, format: email }
 *                   buxheti_max:    { type: number }
 *                   lloji_klientit: { type: string }
 *   post:
 *     summary: Create a client record (admin / agent)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emri, mbiemri]
 *             properties:
 *               user_id:        { type: integer }
 *               emri:           { type: string }
 *               mbiemri:        { type: string }
 *               telefoni:       { type: string }
 *               email:          { type: string, format: email }
 *               buxheti_max:    { type: number }
 *               preferencat:    { type: string }
 *               lloji_klientit: { type: string }
 *     responses:
 *       201: { description: Client created }
 *       400: { description: Validation error }
 *
 * /api/clients/{id}:
 *   get:
 *     summary: Get a single client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Client object }
 *       404: { description: Not found }
 *   put:
 *     summary: Update a client
 *     tags: [Clients]
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
 *     summary: Delete a client (admin only)
 *     tags: [Clients]
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

// ── GET all clients ────────────────────────────────────────────────────────
router.get('/', requireRole('admin', 'agent'), asyncHandler(async (req, res) => {
  const [results] = await db.query('SELECT * FROM clients ORDER BY id DESC');
  res.json(results);
}));

// ── GET single client ──────────────────────────────────────────────────────
router.get('/:id', requireRole('admin', 'agent', 'user'), asyncHandler(async (req, res) => {
  const [[row]] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Client not found.' });
  res.json(row);
}));

// ── CREATE client ──────────────────────────────────────────────────────────
router.post('/', requireRole('admin', 'agent'), asyncHandler(async (req, res) => {
  const { user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit } = req.body;

  // Input validation
  if (!emri || !emri.trim())       return res.status(400).json({ error: 'emri (first name) is required.' });
  if (!mbiemri || !mbiemri.trim()) return res.status(400).json({ error: 'mbiemri (last name) is required.' });

  const [result] = await db.query(
    'INSERT INTO clients (user_id, emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [user_id || null, emri.trim(), mbiemri.trim(), telefoni || null, email || null,
     buxheti_max != null ? Number(buxheti_max) : null, preferencat || null, lloji_klientit || null]
  );
  res.status(201).json({ message: 'Client created successfully!', id: result.insertId });
}));

// ── UPDATE client ──────────────────────────────────────────────────────────
router.put('/:id', requireRole('admin', 'agent'), asyncHandler(async (req, res) => {
  const { emri, mbiemri, telefoni, email, buxheti_max, preferencat, lloji_klientit } = req.body;

  // Input validation
  if (emri    !== undefined && !emri?.trim())    return res.status(400).json({ error: 'emri cannot be empty.' });
  if (mbiemri !== undefined && !mbiemri?.trim()) return res.status(400).json({ error: 'mbiemri cannot be empty.' });

  const [result] = await db.query(
    `UPDATE clients
       SET emri = ?, mbiemri = ?, telefoni = ?, email = ?, buxheti_max = ?, preferencat = ?, lloji_klientit = ?
     WHERE id = ?`,
    [emri?.trim() ?? null, mbiemri?.trim() ?? null, telefoni ?? null,
     email ?? null, buxheti_max != null ? Number(buxheti_max) : null,
     preferencat ?? null, lloji_klientit ?? null, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Client not found.' });
  res.json({ message: 'Client updated successfully.' });
}));

// ── DELETE client ──────────────────────────────────────────────────────────
router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const [result] = await db.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Client not found.' });
  res.json({ message: 'Client deleted.' });
}));

module.exports = router;

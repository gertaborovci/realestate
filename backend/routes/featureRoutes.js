const express = require('express');
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/:id/features', asyncHandler(async (req, res) => {
  const [results] = await db.query('SELECT * FROM propertyfeatures WHERE property_id = ?', [req.params.id]);
  res.status(200).json(results);
}));

router.post('/:id/features', asyncHandler(async (req, res) => {
  const { emertimi, vlera } = req.body;
  const [result] = await db.query(
    'INSERT INTO propertyfeatures (property_id, emertimi, vlera) VALUES (?, ?, ?)',
    [req.params.id, emertimi, vlera]
  );
  res.status(201).json({ message: 'Feature added successfully.', id: result.insertId });
}));

router.put('/features/:feature_id', asyncHandler(async (req, res) => {
  const { emertimi, vlera } = req.body;
  await db.query('UPDATE propertyfeatures SET emertimi = ?, vlera = ? WHERE id = ?', [emertimi, vlera, req.params.feature_id]);
  res.status(200).json({ message: 'Feature updated successfully.' });
}));

router.delete('/features/:feature_id', asyncHandler(async (req, res) => {
  await db.query('DELETE FROM propertyfeatures WHERE id = ?', [req.params.feature_id]);
  res.status(200).json({ message: 'Feature deleted successfully.' });
}));

module.exports = router;
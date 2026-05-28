const db = require('../db');

async function getAll(req, res) {
  const [results] = await db.query('SELECT * FROM properties ORDER BY id DESC');
  res.status(200).json(results);
}

async function getById(req, res) {
  const [result] = await db.query('SELECT * FROM properties WHERE id = ?', [req.params.id]);
  if (!result.length) return res.status(404).json({ message: 'Property not found.' });
  res.status(200).json(result[0]);
}

async function create(req, res) {
  const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
  const [result] = await db.query(
    'INSERT INTO properties (title, price, location, status, type, image, rooms, bathrooms, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, price, location, status, type, image || '', rooms, bathrooms, area]
  );
  res.status(201).json({ id: result.insertId, ...req.body });
}

async function update(req, res) {
  const { title, price, location, status, type, image, rooms, bathrooms, area } = req.body;
  await db.query(
    'UPDATE properties SET title = ?, price = ?, location = ?, status = ?, type = ?, image = ?, rooms = ?, bathrooms = ?, area = ? WHERE id = ?',
    [title, price, location, status, type, image, rooms, bathrooms, area, req.params.id]
  );
  res.status(200).json({ message: 'Property updated successfully.' });
}

async function remove(req, res) {
  await db.query('DELETE FROM properties WHERE id = ?', [req.params.id]);
  res.status(200).json({ message: 'Property deleted successfully.' });
}

module.exports = { getAll, getById, create, update, remove };

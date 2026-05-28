const db = require('../db');

async function getByClient(req, res) {
  const [rows] = await db.query(
    `SELECT p.* FROM properties p
     INNER JOIN favorites f ON p.id = f.property_id
     WHERE f.client_id = ?`,
    [req.params.client_id]
  );
  res.json(rows);
}

async function create(req, res) {
  const { client_id, property_id } = req.body;
  await db.query(
    'INSERT IGNORE INTO favorites (client_id, property_id) VALUES (?, ?)',
    [client_id, property_id]
  );
  res.status(201).json({ message: 'Favorite added!' });
}

async function remove(req, res) {
  await db.query('DELETE FROM favorites WHERE id = ?', [req.params.id]);
  res.json({ message: 'Favorite removed!' });
}

async function removeByProperty(req, res) {
  const { client_id, property_id } = req.body;
  await db.query('DELETE FROM favorites WHERE client_id = ? AND property_id = ?', [client_id, property_id]);
  res.json({ message: 'Favorite removed!' });
}

module.exports = { getByClient, create, remove, removeByProperty };

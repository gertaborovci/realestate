const db = require('../db');

async function getByUser(req, res) {
  const [rows] = await db.query(
    `SELECT f.id AS favoriteRowId,
            p.id, p.title, p.price, p.location, p.rooms,
            p.bathrooms, p.area, p.status, p.image, p.type, p.agent_id
     FROM favorites f
     JOIN properties p ON f.property_id = p.id
     WHERE f.client_id = ?
     ORDER BY f.id DESC`,
    [req.params.user_id]
  );
  res.json(rows);
}

async function create(req, res) {
  const { user_id, property_id } = req.body;
  if (!user_id || !property_id) {
    return res.status(400).json({ error: 'user_id and property_id are required.' });
  }
  await db.query(
    'INSERT IGNORE INTO favorites (client_id, property_id) VALUES (?, ?)',
    [user_id, property_id]
  );
  res.status(201).json({ message: 'Favorite added.' });
}

async function removeByProperty(req, res) {
  const { user_id, property_id } = req.body;
  await db.query(
    'DELETE FROM favorites WHERE client_id = ? AND property_id = ?',
    [user_id, property_id]
  );
  res.json({ message: 'Favorite removed.' });
}

async function remove(req, res) {
  await db.query('DELETE FROM favorites WHERE id = ?', [req.params.id]);
  res.json({ message: 'Favorite removed.' });
}

module.exports = { getByUser, create, remove, removeByProperty };
const db = require('../db');

async function getByUser(req, res) {
  const [rows] = await db.query(
    'SELECT id, property_id, property_data FROM favorites WHERE user_id = ? ORDER BY created_at DESC',
    [req.params.user_id]
  );
  // property_data is stored as JSON — mysql2 may already parse it
  const favorites = rows.map((r) => ({
    favoriteRowId: r.id,
    ...(typeof r.property_data === 'object' ? r.property_data : JSON.parse(r.property_data)),
  }));
  res.json(favorites);
}

async function create(req, res) {
  const { user_id, property_id, property_data } = req.body;
  if (!user_id || !property_id || !property_data) {
    return res.status(400).json({ error: 'user_id, property_id and property_data are required.' });
  }
  await db.query(
    'INSERT IGNORE INTO favorites (user_id, property_id, property_data) VALUES (?, ?, ?)',
    [user_id, property_id, JSON.stringify(property_data)]
  );
  res.status(201).json({ message: 'Favorite added.' });
}

async function removeByProperty(req, res) {
  const { user_id, property_id } = req.body;
  await db.query(
    'DELETE FROM favorites WHERE user_id = ? AND property_id = ?',
    [user_id, property_id]
  );
  res.json({ message: 'Favorite removed.' });
}

async function remove(req, res) {
  await db.query('DELETE FROM favorites WHERE id = ?', [req.params.id]);
  res.json({ message: 'Favorite removed.' });
}

module.exports = { getByUser, create, remove, removeByProperty };
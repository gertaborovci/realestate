const db = require('../db');

// Average rating + count for one agent
async function getByAgent(req, res) {
  const [rows] = await db.query(
    `SELECT agent_id, agent_name,
            COUNT(*) AS review_count,
            ROUND(AVG(rating), 1) AS avg_rating
     FROM agent_ratings
     WHERE agent_id = ?
     GROUP BY agent_id, agent_name`,
    [req.params.agent_id]
  );
  res.json(rows[0] || { agent_id: +req.params.agent_id, review_count: 0, avg_rating: null });
}

// All ratings submitted by a user
async function getByUser(req, res) {
  const [rows] = await db.query(
    'SELECT * FROM agent_ratings WHERE user_id = ? ORDER BY updated_at DESC',
    [req.params.user_id]
  );
  res.json(rows);
}

// Create or update (upsert) — one rating per user per agent
async function upsert(req, res) {
  const { user_id, agent_id, agent_name, rating, comment } = req.body;
  if (!user_id || !agent_id || !rating) {
    return res.status(400).json({ error: 'user_id, agent_id, and rating are required.' });
  }
  const [result] = await db.query(
    `INSERT INTO agent_ratings (user_id, agent_id, agent_name, rating, comment)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       rating  = VALUES(rating),
       comment = VALUES(comment),
       updated_at = CURRENT_TIMESTAMP`,
    [user_id, agent_id, agent_name || 'Unknown', rating, comment || null]
  );
  res.status(201).json({ message: 'Rating saved.', id: result.insertId || null });
}

// Edit an existing rating (user can only edit their own)
async function update(req, res) {
  const { user_id, rating, comment } = req.body;
  if (!user_id || !rating) {
    return res.status(400).json({ error: 'user_id and rating are required.' });
  }
  const [result] = await db.query(
    'UPDATE agent_ratings SET rating = ?, comment = ? WHERE id = ? AND user_id = ?',
    [rating, comment || null, req.params.id, user_id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Rating not found.' });
  res.json({ message: 'Rating updated.' });
}

// Delete a rating (user can only delete their own)
async function remove(req, res) {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required.' });
  await db.query(
    'DELETE FROM agent_ratings WHERE id = ? AND user_id = ?',
    [req.params.id, user_id]
  );
  res.json({ message: 'Rating deleted.' });
}

// Admin can delete any rating without ownership check
async function removeAsAdmin(req, res) {
  await db.query('DELETE FROM agent_ratings WHERE id = ?', [req.params.id]);
  res.json({ message: 'Rating deleted by admin.' });
}

module.exports = { getByAgent, getByUser, upsert, update, remove, removeAsAdmin };

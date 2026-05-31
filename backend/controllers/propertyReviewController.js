const db = require('../db');

// ── READ: all reviews for a property ─────────────────────────────────────────
async function getByProperty(req, res) {
  const [rows] = await db.query(
    `SELECT pr.*,
            u.username,
            u.photo_url,
            -- Verified: user has an APPROVED visit OR an Active/Finalized contract
            (
              EXISTS (
                SELECT 1 FROM visits v
                WHERE v.user_id = pr.user_id AND v.property_id = pr.property_id
                  AND v.status = 'APPROVED'
              ) OR
              EXISTS (
                SELECT 1 FROM contracts c
                WHERE c.user_id = pr.user_id AND c.property_id = pr.property_id
                  AND c.status IN ('Active','Finalized')
              )
            ) AS is_verified
     FROM property_reviews pr
     JOIN users u ON pr.user_id = u.id
     WHERE pr.property_id = ?
     ORDER BY pr.created_at DESC`,
    [req.params.property_id]
  );
  res.json(rows);
}

// ── READ: all reviews by a user ───────────────────────────────────────────────
async function getByUser(req, res) {
  const [rows] = await db.query(
    `SELECT pr.*, p.title AS property_title, p.location AS property_location
     FROM property_reviews pr
     JOIN properties p ON pr.property_id = p.id
     WHERE pr.user_id = ?
     ORDER BY pr.created_at DESC`,
    [req.params.user_id]
  );
  res.json(rows);
}

// ── READ: all (admin) ─────────────────────────────────────────────────────────
async function getAll(req, res) {
  const [rows] = await db.query(
    `SELECT pr.*,
            u.username, u.email,
            p.title AS property_title
     FROM property_reviews pr
     JOIN users u ON pr.user_id = u.id
     JOIN properties p ON pr.property_id = p.id
     ORDER BY pr.created_at DESC`
  );
  res.json(rows);
}

// ── CREATE ────────────────────────────────────────────────────────────────────
async function create(req, res) {
  const { user_id, property_id, rating, comment } = req.body;
  if (!user_id || !property_id || !rating) {
    return res.status(400).json({ error: 'user_id, property_id and rating are required.' });
  }
  const [result] = await db.query(
    'INSERT INTO property_reviews (user_id, property_id, rating, comment) VALUES (?, ?, ?, ?)',
    [user_id, property_id, Number(rating), comment?.trim() || null]
  );
  res.status(201).json({ id: result.insertId, message: 'Review submitted.' });
}

// ── UPDATE ────────────────────────────────────────────────────────────────────
async function update(req, res) {
  const { rating, comment } = req.body;
  const [result] = await db.query(
    'UPDATE property_reviews SET rating = ?, comment = ? WHERE id = ?',
    [Number(rating), comment?.trim() || null, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Review not found.' });
  res.json({ message: 'Review updated.' });
}

// ── DELETE ────────────────────────────────────────────────────────────────────
async function remove(req, res) {
  const [result] = await db.query('DELETE FROM property_reviews WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Review not found.' });
  res.json({ message: 'Review deleted.' });
}

module.exports = { getByProperty, getByUser, getAll, create, update, remove };

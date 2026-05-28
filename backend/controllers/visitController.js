const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query(`
    SELECT v.*,
           p.title AS property_title,
           p.location AS property_location,
           u.username AS user_name,
           u.email AS user_email
    FROM visits v
    LEFT JOIN properties p ON v.property_id = p.id
    LEFT JOIN users u ON v.user_id = u.id
    ORDER BY v.created_at DESC
  `);
  res.json(rows);
}

async function getById(req, res) {
  const [rows] = await db.query(
    `SELECT v.*, p.title AS property_title, u.username AS user_name
     FROM visits v
     LEFT JOIN properties p ON v.property_id = p.id
     LEFT JOIN users u ON v.user_id = u.id
     WHERE v.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Visit not found.' });
  res.json(rows[0]);
}

async function getByUser(req, res) {
  const [rows] = await db.query(
    `SELECT v.*, p.title AS property_title
     FROM visits v
     LEFT JOIN properties p ON v.property_id = p.id
     WHERE v.user_id = ?
     ORDER BY v.visit_date DESC`,
    [req.params.user_id]
  );
  res.json(rows);
}

async function create(req, res) {
  const { property_id, user_id, visit_date, visit_time, status } = req.body;
  if (!property_id || !user_id || !visit_date || !visit_time) {
    return res.status(400).json({
      error: 'property_id, user_id, visit_date, and visit_time are required.',
    });
  }
  const [result] = await db.query(
    `INSERT INTO visits (property_id, user_id, visit_date, visit_time, status)
     VALUES (?, ?, ?, ?, ?)`,
    [property_id, user_id, visit_date, visit_time, status || 'PENDING']
  );
  res.status(201).json({
    id: result.insertId,
    property_id,
    user_id,
    visit_date,
    visit_time,
    status: status || 'PENDING',
  });
}

async function update(req, res) {
  const { status, visit_date, visit_time } = req.body;
  const [result] = await db.query(
    `UPDATE visits SET status = COALESCE(?, status),
     visit_date = COALESCE(?, visit_date),
     visit_time = COALESCE(?, visit_time)
     WHERE id = ?`,
    [status, visit_date, visit_time, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Visit not found.' });
  res.json({ message: 'Visit updated successfully.' });
}

async function remove(req, res) {
  const [result] = await db.query('DELETE FROM visits WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Visit not found.' });
  res.json({ message: 'Visit deleted successfully.' });
}

module.exports = { getAll, getById, getByUser, create, update, remove };

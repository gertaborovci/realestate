const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query(`
    SELECT m.*,
           p.title    AS property_title,
           p.location AS property_location,
           u.username AS user_name,
           u.email    AS user_email
    FROM maintenance_requests m
    LEFT JOIN properties p ON m.property_id = p.id
    LEFT JOIN users      u ON m.user_id     = u.id
    ORDER BY
      FIELD(m.priority, 'Urgent','High','Medium','Low'),
      m.created_at DESC
  `);
  res.json(rows);
}

async function getById(req, res) {
  const [[row]] = await db.query(`
    SELECT m.*,
           p.title    AS property_title,
           p.location AS property_location,
           u.username AS user_name,
           u.email    AS user_email
    FROM maintenance_requests m
    LEFT JOIN properties p ON m.property_id = p.id
    LEFT JOIN users      u ON m.user_id     = u.id
    WHERE m.id = ?
  `, [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Maintenance request not found.' });
  res.json(row);
}

async function create(req, res) {
  const {
    property_id, user_id, title, description,
    category, priority, media_url,
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const [result] = await db.query(
    `INSERT INTO maintenance_requests
       (property_id, user_id, title, description, category, priority, status, media_url)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)`,
    [
      property_id || null,
      user_id     || null,
      title,
      description,
      category    || 'General',
      priority    || 'Medium',
      media_url   || null,
    ]
  );

  res.status(201).json({ id: result.insertId, message: 'Maintenance request submitted.' });
}

async function update(req, res) {
  const [[current]] = await db.query(
    'SELECT * FROM maintenance_requests WHERE id = ?',
    [req.params.id]
  );
  if (!current) return res.status(404).json({ error: 'Maintenance request not found.' });

  const status = req.body.status ?? current.status;
  const admin_notes         = 'admin_notes'         in req.body
    ? (req.body.admin_notes         || null) : current.admin_notes;
  const assigned_technician = 'assigned_technician' in req.body
    ? (req.body.assigned_technician || null) : current.assigned_technician;
  const cost = 'cost' in req.body
    ? (req.body.cost !== '' && req.body.cost != null ? req.body.cost : null)
    : current.cost;

  await db.query(
    `UPDATE maintenance_requests
     SET status=?, admin_notes=?, assigned_technician=?, cost=?
     WHERE id=?`,
    [status, admin_notes, assigned_technician, cost, req.params.id]
  );

  res.json({ message: 'Maintenance request updated.' });
}

async function remove(req, res) {
  const [result] = await db.query(
    'DELETE FROM maintenance_requests WHERE id = ?',
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Maintenance request not found.' });
  res.json({ message: 'Maintenance request deleted.' });
}

module.exports = { getAll, getById, create, update, remove };

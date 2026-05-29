const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query(`
    SELECT v.*,
           p.title        AS property_title,
           p.location     AS property_location,
           u.username     AS user_name,
           u.email        AS user_email,
           a.username     AS agent_name
    FROM visits v
    LEFT JOIN properties p ON v.property_id = p.id
    LEFT JOIN users      u ON v.user_id     = u.id
    LEFT JOIN Agents     a ON v.agent_id    = a.id
    ORDER BY v.created_at DESC
  `);
  res.json(rows);
}

async function getById(req, res) {
  const [rows] = await db.query(
    `SELECT v.*,
            p.title    AS property_title,
            u.username AS user_name,
            a.username AS agent_name
     FROM visits v
     LEFT JOIN properties p ON v.property_id = p.id
     LEFT JOIN users      u ON v.user_id     = u.id
     LEFT JOIN Agents     a ON v.agent_id    = a.id
     WHERE v.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Visit not found.' });
  res.json(rows[0]);
}

async function getByUser(req, res) {
  const [rows] = await db.query(
    `SELECT v.*,
            p.title    AS property_title,
            a.username AS agent_name
     FROM visits v
     LEFT JOIN properties p ON v.property_id = p.id
     LEFT JOIN Agents     a ON v.agent_id    = a.id
     WHERE v.user_id = ?
     ORDER BY v.visit_date DESC`,
    [req.params.user_id]
  );
  res.json(rows);
}

async function getByAgent(req, res) {
  // Returns ONLY property visits for this agent (property_id IS NOT NULL).
  // Consultations (property_id IS NULL) are handled by getConsultationsByAgent.
  const [rows] = await db.query(
    `SELECT v.*,
            p.title    AS property_title,
            p.location AS property_location,
            u.username AS user_name,
            u.email    AS user_email
     FROM visits v
     LEFT JOIN properties p ON v.property_id = p.id
     LEFT JOIN users      u ON v.user_id     = u.id
     WHERE v.property_id IS NOT NULL
       AND (v.agent_id = ? OR p.agent_id = ?)
     ORDER BY v.visit_date DESC`,
    [req.params.agent_id, req.params.agent_id]
  );
  res.json(rows);
}

async function getConsultationsByAgent(req, res) {
  // Returns ONLY consultation requests for this agent (property_id IS NULL).
  const [rows] = await db.query(
    `SELECT v.*,
            u.username AS user_name,
            u.email    AS user_email
     FROM visits v
     LEFT JOIN users u ON v.user_id = u.id
     WHERE v.agent_id = ? AND v.property_id IS NULL
     ORDER BY v.visit_date DESC, v.visit_time DESC`,
    [req.params.agent_id]
  );
  res.json(rows);
}

async function create(req, res) {
  const { agent_id, property_id, user_id, visit_date, visit_time, notes, status } = req.body;

  if (!visit_date || !visit_time) {
    return res.status(400).json({
      error: 'visit_date and visit_time are required.',
    });
  }
  if (!agent_id && !property_id) {
    return res.status(400).json({
      error: 'Either agent_id or property_id is required.',
    });
  }

  const [result] = await db.query(
    `INSERT INTO visits (agent_id, property_id, user_id, visit_date, visit_time, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      agent_id    || null,
      property_id || null,
      user_id,
      visit_date,
      visit_time,
      notes       || null,
      status      || 'PENDING',
    ]
  );
  res.status(201).json({
    id:          result.insertId,
    agent_id:    agent_id    || null,
    property_id: property_id || null,
    user_id,
    visit_date,
    visit_time,
    notes:       notes || null,
    status:      status || 'PENDING',
  });
}

async function update(req, res) {
  const [[current]] = await db.query('SELECT * FROM visits WHERE id = ?', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'Visit not found.' });

  const status     = req.body.status     ?? current.status;
  const visit_date = req.body.visit_date ?? current.visit_date;
  const visit_time = req.body.visit_time ?? current.visit_time;
  const notes      = 'notes' in req.body ? (req.body.notes || null) : current.notes;

  await db.query(
    `UPDATE visits SET status=?, visit_date=?, visit_time=?, notes=? WHERE id=?`,
    [status, visit_date, visit_time, notes, req.params.id]
  );
  res.json({ message: 'Visit updated successfully.' });
}

async function remove(req, res) {
  const [result] = await db.query('DELETE FROM visits WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Visit not found.' });
  res.json({ message: 'Visit deleted successfully.' });
}

module.exports = { getAll, getById, getByUser, getByAgent, getConsultationsByAgent, create, update, remove };

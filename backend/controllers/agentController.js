const db = require('../db');

async function getAll(req, res) {
  const [agents] = await db.query(`
    SELECT a.*, u.username, u.email
    FROM agents a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.id DESC
  `);
  res.json(agents);
}

async function getById(req, res) {
  const [agents] = await db.query(`
    SELECT a.*, u.username, u.email
    FROM agents a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `, [req.params.id]);

  if (!agents.length) return res.status(404).json({ error: 'Agent not found.' });
  res.json(agents[0]);
}

async function create(req, res) {
  const { user_id, license_number, specialization, commission_percentage, zone, status } = req.body;
  const [result] = await db.query(
    `INSERT INTO agents (user_id, license_number, specialization, commission_percentage, zone, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, license_number, specialization, commission_percentage, zone, status || 'Active']
  );
  res.status(201).json({ id: result.insertId, ...req.body });
}

async function update(req, res) {
  const { license_number, specialization, commission_percentage, zone, status } = req.body;
  const [result] = await db.query(
    `UPDATE agents SET license_number = ?, specialization = ?, commission_percentage = ?, zone = ?, status = ?
     WHERE id = ?`,
    [license_number, specialization, commission_percentage, zone, status, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Agent not found.' });
  res.json({ message: 'Agent updated successfully.' });
}

async function remove(req, res) {
  const [result] = await db.query('DELETE FROM agents WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Agent not found.' });
  res.json({ message: 'Agent deleted successfully.' });
}

module.exports = { getAll, getById, create, update, remove };

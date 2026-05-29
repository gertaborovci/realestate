const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query('SELECT * FROM certifications ORDER BY created_at DESC');
  res.json(rows);
}

async function getByAgent(req, res) {
  const [rows] = await db.query(
    'SELECT * FROM certifications WHERE agent_id = ? ORDER BY created_at DESC',
    [req.params.agent_id]
  );
  res.json(rows);
}

async function create(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No document file provided.' });

  const documentUrl = `/uploads/${req.file.filename}`;
  const type        = req.body.type     || 'Passport / ID';
  const agentId     = req.body.agent_id;

  if (!agentId) return res.status(400).json({ error: 'agent_id is required.' });

  const [result] = await db.query(
    'INSERT INTO certifications (agent_id, document_url, type, status) VALUES (?, ?, ?, ?)',
    [agentId, documentUrl, type, 'Pending']
  );

  res.status(201).json({
    id:           result.insertId,
    agent_id:     agentId,
    document_url: documentUrl,
    type,
    status:       'Pending',
  });
}

async function update(req, res) {
  const [[current]] = await db.query(
    'SELECT * FROM certifications WHERE id = ?',
    [req.params.id]
  );
  if (!current) return res.status(404).json({ error: 'Certification not found.' });

  const type       = req.body.type       ?? current.type;
  const status     = req.body.status     ?? current.status;
  const expires_at = 'expires_at' in req.body ? (req.body.expires_at || null) : current.expires_at;

  // If a new file was uploaded, replace the document_url; otherwise keep the old one
  const documentUrl = req.file ? `/uploads/${req.file.filename}` : current.document_url;

  await db.query(
    'UPDATE certifications SET type=?, status=?, expires_at=?, document_url=? WHERE id=?',
    [type, status, expires_at, documentUrl, req.params.id]
  );

  res.json({ message: 'Certification updated.', document_url: documentUrl });
}

async function remove(req, res) {
  const [result] = await db.query(
    'DELETE FROM certifications WHERE id = ?',
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Certification not found.' });
  res.json({ message: 'Certification deleted.' });
}

module.exports = { getAll, getByAgent, create, update, remove };

const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query('SELECT * FROM certifications ORDER BY created_at DESC');
  res.json(rows);
}

async function create(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No document file provided.' });

  const documentUrl = `/uploads/${req.file.filename}`;
  const type = req.body.type || 'Passport / ID';
  const agentId = req.body.agent_id || 1;

  const [result] = await db.query(
    'INSERT INTO certifications (agent_id, document_url, type, status) VALUES (?, ?, ?, ?)',
    [agentId, documentUrl, type, 'Pending']
  );

  res.status(201).json({
    message: 'Certification uploaded successfully.',
    id: result.insertId,
    document_url: documentUrl,
  });
}

async function remove(req, res) {
  await db.query('DELETE FROM certifications WHERE id = ?', [req.params.id]);
  res.json({ message: 'Certification deleted.' });
}

module.exports = { getAll, create, remove };

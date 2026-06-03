const db = require('../db');
const { createNotification } = require('../utils/notify');

async function getAll(req, res) {
  // JOIN through agents → users to get the agent's name & email for the admin review panel
  const [rows] = await db.query(`
    SELECT c.*,
           u.username AS agent_name,
           u.email    AS agent_email
    FROM certifications c
    LEFT JOIN agents a ON c.agent_id = a.id
    LEFT JOIN users  u ON a.user_id  = u.id
    ORDER BY
      FIELD(c.status, 'Pending', 'Rejected', 'Verified'),
      c.created_at DESC
  `);
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

  const isAdmin = req.authUser?.role === 'admin';
  const type             = req.body.type ?? current.type;
  const status           = isAdmin && req.body.status           ? req.body.status           : current.status;
  const expires_at       = isAdmin && 'expires_at'       in req.body ? (req.body.expires_at       || null) : current.expires_at;
  const rejection_reason = isAdmin && 'rejection_reason' in req.body ? (req.body.rejection_reason || null) : current.rejection_reason;

  // If a new file was uploaded replace the url; otherwise keep existing
  const documentUrl = req.file ? `/uploads/${req.file.filename}` : current.document_url;

  await db.query(
    `UPDATE certifications
     SET type=?, status=?, expires_at=?, document_url=?, rejection_reason=?
     WHERE id=?`,
    [type, status, expires_at, documentUrl, rejection_reason, req.params.id]
  );

  // Notify the agent's user account when status changes to Verified or Rejected
  if (req.body.status && req.body.status !== current.status) {
    // Resolve the agent's user_id from the agents table
    const [[agent]] = await db.query(
      'SELECT user_id FROM agents WHERE id = ?',
      [current.agent_id]
    ).catch(() => [[]]);

    if (agent?.user_id) {
      if (req.body.status === 'Verified') {
        await createNotification({
          user_id: agent.user_id,
          type:    'cert_update',
          title:   'Document Verified ✅',
          message: `Your ${type} document has been verified by the admin.`,
          link:    'agent-dashboard',
        });
      } else if (req.body.status === 'Rejected') {
        await createNotification({
          user_id: agent.user_id,
          type:    'cert_update',
          title:   'Document Rejected',
          message: rejection_reason
            ? `Your ${type} document was rejected: ${rejection_reason}`
            : `Your ${type} document has been rejected. Please re-upload.`,
          link:    'agent-dashboard',
        });
      }
    }
  }

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

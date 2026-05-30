const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query(
    'SELECT * FROM contact_inquiries ORDER BY created_at DESC'
  );
  res.json(rows);
}

async function getByAgent(req, res) {
  const [rows] = await db.query(
    'SELECT * FROM contact_inquiries WHERE agent_id = ? ORDER BY created_at DESC',
    [req.params.agent_id]
  );
  res.json(rows);
}

async function create(req, res) {
  const { agent_id, client_name, client_email, message } = req.body;
  if (!client_name || !message) {
    return res.status(400).json({ error: 'Client name and message are required.' });
  }
  const [result] = await db.query(
    'INSERT INTO contact_inquiries (agent_id, client_name, client_email, message, status) VALUES (?, ?, ?, ?, ?)',
    [agent_id || null, client_name, client_email || null, message, 'new']
  );
  res.status(201).json({ message: 'Inquiry submitted.', id: result.insertId });
}

async function update(req, res) {
  const [[current]] = await db.query(
    'SELECT * FROM contact_inquiries WHERE id = ?',
    [req.params.id]
  );
  if (!current) return res.status(404).json({ error: 'Inquiry not found.' });

  const client_name  = req.body.client_name  ?? current.client_name;
  const client_email = 'client_email' in req.body ? (req.body.client_email || null) : current.client_email;
  const message      = req.body.message      ?? current.message;
  const status       = req.body.status       ?? current.status;

  await db.query(
    'UPDATE contact_inquiries SET client_name=?, client_email=?, message=?, status=? WHERE id=?',
    [client_name, client_email, message, status, req.params.id]
  );
  res.json({ message: 'Inquiry updated.' });
}

async function reply(req, res) {
  const { reply: replyText } = req.body;
  if (!replyText || !replyText.trim()) {
    return res.status(400).json({ error: 'Reply text is required.' });
  }
  const [result] = await db.query(
    "UPDATE contact_inquiries SET reply = ?, status = 'replied' WHERE id = ?",
    [replyText.trim(), req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Inquiry not found.' });
  res.json({ message: 'Reply sent successfully.' });
}

async function updateStatus(req, res) {
  const { status } = req.body;
  const valid = ['new', 'read', 'replied', 'closed'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
  }
  const [result] = await db.query(
    'UPDATE contact_inquiries SET status = ? WHERE id = ?',
    [status, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Inquiry not found.' });
  res.json({ message: 'Status updated.' });
}

async function remove(req, res) {
  const [result] = await db.query(
    'DELETE FROM contact_inquiries WHERE id = ?',
    [req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'Inquiry not found.' });
  res.json({ message: 'Inquiry deleted.' });
}

module.exports = { getAll, getByAgent, create, update, reply, updateStatus, remove };

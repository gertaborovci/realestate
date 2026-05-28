const db = require('../db');

async function getAll(req, res) {
  const [rows] = await db.query('SELECT * FROM contact_inquiries ORDER BY created_at DESC');
  res.json(rows);
}

async function create(req, res) {
  const { agent_id, client_name, client_email, message } = req.body;
  if (!client_name || !message) {
    return res.status(400).json({ error: 'Client name and message are required.' });
  }
  const [result] = await db.query(
    'INSERT INTO contact_inquiries (agent_id, client_name, client_email, message) VALUES (?, ?, ?, ?)',
    [agent_id || 1, client_name, client_email, message]
  );
  res.status(201).json({ message: 'Inquiry submitted.', id: result.insertId });
}

async function reply(req, res) {
  const { reply } = req.body;
  await db.query(
    "UPDATE contact_inquiries SET reply = ?, status = 'replied' WHERE id = ?",
    [reply, req.params.id]
  );
  res.json({ message: 'Reply sent successfully.' });
}

module.exports = { getAll, create, reply };

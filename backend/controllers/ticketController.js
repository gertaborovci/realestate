const db = require('../db');
const { createNotification } = require('../utils/notify');

// GET /api/tickets  — admin: all tickets
async function getAll(req, res) {
  const [rows] = await db.query(`
    SELECT t.*,
           u.username AS user_name,
           u.email    AS user_email
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY
      FIELD(t.status, 'Open', 'In Progress', 'Resolved', 'Closed'),
      FIELD(t.priority, 'Urgent', 'High', 'Medium', 'Low'),
      t.created_at DESC
  `);
  res.json(rows);
}

// GET /api/tickets/:id  — single ticket detail
async function getById(req, res) {
  const [[row]] = await db.query(
    `SELECT t.*, u.username AS user_name, u.email AS user_email
     FROM tickets t
     LEFT JOIN users u ON t.user_id = u.id
     WHERE t.id = ?`,
    [req.params.id]
  );
  if (!row) return res.status(404).json({ error: 'Ticket not found.' });
  res.json(row);
}

// GET /api/tickets/user/:user_id  — user's own tickets
async function getByUser(req, res) {
  const [rows] = await db.query(
    `SELECT * FROM tickets
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [req.params.user_id]
  );
  res.json(rows);
}

// POST /api/tickets  — create new ticket
async function create(req, res) {
  const { user_id, subject, message, priority } = req.body;

  if (!user_id || !subject || !message) {
    return res.status(400).json({ error: 'user_id, subject, and message are required.' });
  }

  const [result] = await db.query(
    `INSERT INTO tickets (user_id, subject, message, priority, status)
     VALUES (?, ?, ?, ?, 'Open')`,
    [user_id, subject.trim(), message.trim(), priority || 'Medium']
  );

  // Notify admin — find the first admin user
  const [[admin]] = await db.query(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
  ).catch(() => [[]]);

  if (admin?.id) {
    await createNotification({
      user_id: admin.id,
      type:    'ticket',
      title:   '🎫 New Support Ticket',
      message: `New ${priority || 'Medium'} priority ticket: "${subject.trim()}"`,
      link:    'support',
    });
  }

  res.status(201).json({
    id:       result.insertId,
    user_id,
    subject:  subject.trim(),
    message:  message.trim(),
    priority: priority || 'Medium',
    status:   'Open',
  });
}

// PUT /api/tickets/:id  — admin updates status / writes reply
async function update(req, res) {
  const [[current]] = await db.query('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'Ticket not found.' });

  const status      = req.body.status      ?? current.status;
  const priority    = req.body.priority    ?? current.priority;
  const admin_reply = 'admin_reply' in req.body
    ? (req.body.admin_reply || null)
    : current.admin_reply;

  await db.query(
    `UPDATE tickets SET status=?, priority=?, admin_reply=? WHERE id=?`,
    [status, priority, admin_reply, req.params.id]
  );

  // Notify the user when admin replies or changes status
  const statusChanged = req.body.status && req.body.status !== current.status;
  const replyAdded    = 'admin_reply' in req.body && req.body.admin_reply && req.body.admin_reply !== current.admin_reply;

  if ((statusChanged || replyAdded) && current.user_id) {
    let title   = 'Your Support Ticket Was Updated';
    let message = `Your ticket "${current.subject}" has been updated.`;

    if (status === 'Resolved') {
      title   = 'Support Ticket Resolved ✅';
      message = `Your ticket "${current.subject}" has been marked as resolved.`;
    } else if (replyAdded) {
      title   = 'Admin Replied to Your Ticket 💬';
      message = `Admin replied to your ticket "${current.subject}".`;
    } else if (status === 'In Progress') {
      title   = 'Ticket In Progress 🔧';
      message = `Your ticket "${current.subject}" is now being handled.`;
    }

    await createNotification({
      user_id: current.user_id,
      type:    'ticket',
      title,
      message,
      link:    'support',
    });
  }

  res.json({ message: 'Ticket updated.' });
}

// DELETE /api/tickets/:id
async function remove(req, res) {
  const [result] = await db.query('DELETE FROM tickets WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Ticket not found.' });
  res.json({ message: 'Ticket deleted.' });
}

module.exports = { getAll, getById, getByUser, create, update, remove };

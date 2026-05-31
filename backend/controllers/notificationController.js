const db = require('../db');

// GET /api/notifications/user/:user_id
async function getByUser(req, res) {
  const [rows] = await db.query(
    `SELECT * FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [req.params.user_id]
  );
  res.json(rows);
}

// GET /api/notifications/user/:user_id/unread-count
async function getUnreadCount(req, res) {
  const [[row]] = await db.query(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.params.user_id]
  );
  res.json({ count: row.count });
}

// PUT /api/notifications/:id/read  — mark one as read
async function markRead(req, res) {
  await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Marked as read.' });
}

// PUT /api/notifications/user/:user_id/read-all  — mark all as read
async function markAllRead(req, res) {
  await db.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [req.params.user_id]
  );
  res.json({ message: 'All notifications marked as read.' });
}

// DELETE /api/notifications/:id
async function remove(req, res) {
  const [result] = await db.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Notification not found.' });
  res.json({ message: 'Notification deleted.' });
}

// DELETE /api/notifications/user/:user_id/clear-all  — delete all for user
async function clearAll(req, res) {
  await db.query('DELETE FROM notifications WHERE user_id = ?', [req.params.user_id]);
  res.json({ message: 'All notifications cleared.' });
}

// POST /api/notifications  — create one (system / admin use)
async function create(req, res) {
  const { user_id, type, title, message, link } = req.body;
  if (!user_id || !title || !message) {
    return res.status(400).json({ error: 'user_id, title and message are required.' });
  }
  const [result] = await db.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
    [user_id, type || 'system', title, message, link || null]
  );
  res.status(201).json({ id: result.insertId, message: 'Notification created.' });
}

// GET /api/notifications  — admin: all notifications with user info
async function getAll(req, res) {
  const [rows] = await db.query(
    `SELECT n.*, u.username AS user_name
     FROM notifications n
     LEFT JOIN users u ON n.user_id = u.id
     ORDER BY n.created_at DESC
     LIMIT 300`
  );
  res.json(rows);
}

// PUT /api/notifications/:id  — admin: edit title / message / type
async function update(req, res) {
  const { title, message, type } = req.body;
  if (!title && !message && !type) {
    return res.status(400).json({ error: 'Provide at least one field to update.' });
  }
  await db.query(
    'UPDATE notifications SET title = COALESCE(?, title), message = COALESCE(?, message), type = COALESCE(?, type) WHERE id = ?',
    [title || null, message || null, type || null, req.params.id]
  );
  res.json({ message: 'Updated.' });
}

// POST /api/notifications/broadcast  — admin sends to ALL users
async function broadcast(req, res) {
  const { title, message, link } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required.' });
  }

  const [users] = await db.query('SELECT id FROM users');
  if (!users.length) return res.json({ message: 'No users found.' });

  const values = users.map((u) => [u.id, 'broadcast', title, message, link || null]);
  await db.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES ?',
    [values]
  );

  res.json({ message: `Broadcast sent to ${users.length} users.`, count: users.length });
}

module.exports = {
  getAll, getByUser, getUnreadCount,
  markRead, markAllRead,
  update, remove, clearAll,
  create, broadcast,
};

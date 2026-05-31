const db = require('../db');

/**
 * Create a single in-app notification.
 * Never throws — notification failure must never break the caller.
 */
async function createNotification({ user_id, type = 'system', title, message, link = null }) {
  if (!user_id) return;
  await db.query(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)',
    [user_id, type, title, message, link]
  ).catch((err) => console.error('[notify] failed to create notification:', err.message));
}

module.exports = { createNotification };

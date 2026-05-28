const bcrypt = require('bcryptjs');
const db = require('../db');
const { normalizeRole } = require('../utils/roles');

async function getAll(req, res) {
  const [users] = await db.query(
    'SELECT id, username, email, role, created_at FROM users ORDER BY id ASC'
  );
  res.json(users);
}

async function updateRole(req, res) {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required.' });
  const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: 'Role updated successfully.' });
}

async function remove(req, res) {
  await db.query('DELETE FROM agents WHERE user_id = ?', [req.params.id]);
  const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: 'User deleted successfully.' });
}

async function register(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const mappedRole = role === 'agent' ? 'agent' : role === 'admin' ? 'admin' : 'user';
  const hash = await bcrypt.hash(password, 10);

  try {
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, mappedRole]
    );
    res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: result.insertId,
        username: name,
        email,
        role: normalizeRole(mappedRole),
      },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    throw err;
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const [users] = await db.query(
    'SELECT id, username, email, password, role FROM users WHERE email = ?',
    [email]
  );
  if (!users.length) return res.status(401).json({ error: 'Invalid credentials.' });

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

  res.json({
    message: 'Login successful.',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: normalizeRole(user.role),
    },
  });
}

module.exports = { getAll, updateRole, remove, register, login };

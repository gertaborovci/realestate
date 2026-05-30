const bcrypt = require('bcryptjs');
const db = require('../db');
const { normalizeRole } = require('../utils/roles');

async function getAll(req, res) {
  const [users] = await db.query(
    `SELECT id, username, email, phone, bio, license_id, specialization, photo_url, role, created_at
     FROM users ORDER BY id ASC`
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
    const newUserId = result.insertId;

    // Automatically create the agents profile row for agent accounts
    if (mappedRole === 'agent') {
      await db.query(
        'INSERT INTO agents (user_id, status) VALUES (?, ?)',
        [newUserId, 'Active']
      );
    }

    res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: newUserId,
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
    'SELECT id, username, email, phone, bio, license_id, specialization, photo_url, password, role FROM users WHERE email = ?',
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
      phone: user.phone || null,
      bio: user.bio || null,
      license_id: user.license_id || null,
      specialization: user.specialization || null,
      photo_url: user.photo_url || null,
      role: normalizeRole(user.role),
    },
  });
}

async function updateProfile(req, res) {
  const { name, phone, bio, license_id, specialization } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  const [result] = await db.query(
    'UPDATE users SET username = ?, phone = ?, bio = ?, license_id = ?, specialization = ? WHERE id = ?',
    [
      name.trim(),
      phone?.trim() || null,
      bio?.trim() || null,
      license_id?.trim() || null,
      specialization?.trim() || null,
      req.params.id,
    ]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'User not found.' });
  res.json({ message: 'Profile updated.' });
}

async function uploadPhoto(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No image file provided.' });
  const photoUrl = `/uploads/profiles/${req.file.filename}`;
  await db.query('UPDATE users SET photo_url = ? WHERE id = ?', [photoUrl, req.params.id]);
  res.json({ message: 'Photo updated.', photo_url: photoUrl });
}

async function deletePhoto(req, res) {
  await db.query('UPDATE users SET photo_url = NULL WHERE id = ?', [req.params.id]);
  res.json({ message: 'Photo removed.' });
}

module.exports = { getAll, updateRole, remove, register, login, updateProfile, uploadPhoto, deletePhoto };

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../db');
const { normalizeRole } = require('../utils/roles');

const JWT_SECRET         = process.env.JWT_SECRET         || 'kosovanest_jwt_secret_2024';
const JWT_EXPIRES        = process.env.JWT_EXPIRES        || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'kosovanest_refresh_secret_2024';
const JWT_REFRESH_EXPIRES= process.env.JWT_REFRESH_EXPIRES|| '30d';

/** httpOnly cookie settings for the refresh token */
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,                                        // never accessible via JS
  secure:   process.env.NODE_ENV === 'production',       // HTTPS only in prod
  sameSite: 'lax',                                       // protects against CSRF
  maxAge:   30 * 24 * 60 * 60 * 1000,                   // 30 days in ms
  path:     '/',
};

/** Generate both access + refresh tokens for a user payload */
function generateTokens(payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES }
  );
  return { token, refreshToken };
}

async function getAll(req, res) {
  const [users] = await db.query(
    `SELECT id, username, email, phone, bio, license_id, specialization, photo_url, role, created_at
     FROM users ORDER BY id ASC`
  );
  res.json(users);
}

async function getById(req, res) {
  const [[user]] = await db.query(
    `SELECT id, username, email, phone, bio, license_id, specialization, photo_url, role, created_at
     FROM users WHERE id = ?`,
    [req.params.id]
  );
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(user);
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

    const { token, refreshToken } = generateTokens({
      id: newUserId, email, role: normalizeRole(mappedRole),
    });

    // Refresh token goes in a secure httpOnly cookie — never exposed to JS
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

    res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: newUserId,
        username: name,
        email,
        role: normalizeRole(mappedRole),
      },
      token,
      // refreshToken intentionally omitted from body
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

  const { token, refreshToken } = generateTokens({
    id: user.id, email: user.email, role: normalizeRole(user.role),
  });

  // Refresh token stored in a secure httpOnly cookie
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

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
    token,
    // refreshToken intentionally omitted from body — lives in httpOnly cookie
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

/**
 * POST /api/auth/refresh
 * Accepts a refresh token, verifies it, and returns a new access token.
 */
async function refresh(req, res) {
  // Refresh token arrives via httpOnly cookie (not request body)
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token. Please log in again.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired refresh token. Please log in again.' });
  }

  if (decoded.type !== 'refresh') {
    return res.status(401).json({ error: 'Invalid token type.' });
  }

  // Verify the user still exists and has the same role
  const [[user]] = await db.query(
    'SELECT id, email, role FROM users WHERE id = ?',
    [decoded.id]
  );
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists.' });
  }

  const { normalizeRole: nr } = require('../utils/roles');
  const { token, refreshToken: newRefresh } = generateTokens({
    id: user.id, email: user.email, role: nr(user.role),
  });

  // Rotate the refresh token cookie
  res.cookie('refreshToken', newRefresh, REFRESH_COOKIE_OPTS);
  res.json({ token }); // only return the new access token
}

/**
 * POST /api/auth/logout
 * Client-side logout — instructs the frontend to clear tokens.
 * (Stateless JWT: we can't invalidate tokens server-side without a blocklist.)
 */
async function logout(req, res) {
  // Clear the httpOnly refresh token cookie
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out successfully.' });
}

module.exports = { getAll, getById, updateRole, remove, register, login, refresh, logout, updateProfile, uploadPhoto, deletePhoto };

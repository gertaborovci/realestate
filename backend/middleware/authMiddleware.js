const jwt = require('jsonwebtoken');
const { normalizeRole } = require('../utils/roles');

const JWT_SECRET = process.env.JWT_SECRET || 'kosovanest_jwt_secret_2024';

/**
 * Extract & verify the authenticated user from the request.
 * Priority:
 *   1. Authorization: Bearer <jwt>  — verified token (secure)
 *   2. x-user-role / x-user-id headers — legacy fallback (dev only)
 */
function getUserFromRequest(req) {
  // 1. Try JWT from Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return {
        id:    decoded.id,
        email: decoded.email,
        role:  normalizeRole(decoded.role),
      };
    } catch {
      // Invalid / expired token — fall through to legacy headers
    }
  }

  // 2. Legacy header fallback (backward compat during development)
  const headerRole = req.headers['x-user-role'];
  const headerId   = req.headers['x-user-id'];
  if (headerRole) {
    return { id: headerId ? Number(headerId) : null, role: normalizeRole(headerRole) };
  }
  if (req.body?.user_role) {
    return { id: req.body.user_id, role: normalizeRole(req.body.user_role) };
  }

  return null;
}

/**
 * Parse a verified JWT from the Authorization header ONLY.
 * Returns null if the header is missing or the token is invalid.
 * Used by requireRole() for strict enforcement.
 */
function getUserFromJWT(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
    return { id: decoded.id, email: decoded.email, role: normalizeRole(decoded.role) };
  } catch {
    return null;
  }
}

/**
 * Middleware factory — requires caller to hold one of the specified roles.
 * Only accepts a verified JWT (Authorization: Bearer <token>).
 * Rejects requests without a valid token or with insufficient role.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = getUserFromJWT(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    req.authUser = user;
    next();
  };
}

module.exports = { getUserFromRequest, requireRole };

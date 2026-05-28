const { normalizeRole } = require('../utils/roles');

function getUserFromRequest(req) {
  const headerRole = req.headers['x-user-role'];
  const headerId = req.headers['x-user-id'];
  if (headerRole) {
    return { id: headerId ? Number(headerId) : null, role: normalizeRole(headerRole) };
  }
  if (req.body?.user_role) {
    return { id: req.body.user_id, role: normalizeRole(req.body.user_role) };
  }
  return null;
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = getUserFromRequest(req);
    if (!user?.role) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const normalized = normalizeRole(user.role);
    if (!allowedRoles.includes(normalized)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    req.authUser = user;
    next();
  };
}

module.exports = { getUserFromRequest, requireRole };

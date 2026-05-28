function normalizeRole(role) {
  if (!role) return null;
  if (role === 'client' || role === 'buyer') return 'user';
  return role;
}

module.exports = { normalizeRole };

const STORAGE_KEY = 'current_user';
const TOKEN_KEY   = 'auth_token';
// Migrate: remove any old refresh token that was stored in localStorage
if (typeof localStorage !== 'undefined') localStorage.removeItem('refresh_token');

// ── Access token helpers ───────────────────────────────────────────────────
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else       localStorage.removeItem(TOKEN_KEY);
}

// ── Refresh token helpers ──────────────────────────────────────────────────
// The refresh token is now stored as an httpOnly cookie set by the server.
// These functions are kept as no-ops so existing imports don't break,
// but they no longer read/write localStorage.
export function getRefreshToken() { return null; }          // cookie is sent automatically
export function setRefreshToken(_token) { /* no-op */ }    // server sets the cookie

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

/** Normalize DB role: client → user */
export function normalizeRole(role) {
  if (!role) return null;
  if (role === 'client' || role === 'buyer') return 'user';
  return role;
}

export function getUserRole() {
  const user = getCurrentUser();
  return normalizeRole(user?.role);
}

export function isAdmin() {
  return getUserRole() === 'admin';
}

export function isAgent() {
  return getUserRole() === 'agent';
}

export function isUser() {
  return getUserRole() === 'user';
}

export function canAccessAdminDashboard() {
  return isAdmin();
}

export function canAccessAgentDashboard() {
  return isAgent();
}

export const DASHBOARD_VIEWS = {
  admin: 'dashboard',
  agent: 'agent-dashboard',
};

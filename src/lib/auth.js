const STORAGE_KEY = 'current_user';

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

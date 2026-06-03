import { getAuthToken, setAuthToken } from './auth';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let isRefreshing = false;          // prevents parallel refresh calls
let refreshQueue = [];             // queued requests waiting for new token

function processQueue(newToken) {
  refreshQueue.forEach(({ resolve }) => resolve(newToken));
  refreshQueue = [];
}

/**
 * Wrapper around fetch() that:
 *  - Prepends API_BASE for relative paths
 *  - Automatically attaches the JWT Authorization header
 *  - Sends credentials: 'include' so the httpOnly refresh-token cookie
 *    is forwarded on every request (including the /refresh call)
 *  - On 401, tries to refresh the access token once and retries
 *  - Throws a descriptive Error on non-2xx responses
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const makeHeaders = () => {
    const token = getAuthToken();
    const h = { ...(options.headers || {}) };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  // credentials:'include' sends the httpOnly refreshToken cookie automatically
  let response = await fetch(url, {
    ...options,
    headers: makeHeaders(),
    credentials: 'include',
  });

  // ── Auto-refresh on 401 ──────────────────────────────────────────────────
  if (response.status === 401 && !path.includes('/api/auth/')) {
    if (isRefreshing) {
      // Another refresh is already in flight — queue this request
      const newToken = await new Promise((resolve) => refreshQueue.push({ resolve }));
      if (newToken) {
        response = await fetch(url, {
          ...options,
          headers: { ...(options.headers || {}), Authorization: `Bearer ${newToken}` },
          credentials: 'include',
        });
      }
    } else {
      isRefreshing = true;
      try {
        // The httpOnly cookie is sent automatically via credentials:'include'
        // No need to pass the refresh token in the request body
        const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAuthToken(data.token);
          processQueue(data.token);
          // Retry original request with new access token
          response = await fetch(url, {
            ...options,
            headers: { ...(options.headers || {}), Authorization: `Bearer ${data.token}` },
            credentials: 'include',
          });
        } else {
          // Refresh failed — clear access token (force re-login)
          setAuthToken(null);
          processQueue(null);
        }
      } finally {
        isRefreshing = false;
      }
    }
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

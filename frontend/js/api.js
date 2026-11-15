import { BACKEND_URL } from './config.js';

// When the page is opened from the Node server (http://localhost:5000) we call /api on the same address.
// If it is opened some other way (for example VS Code Live Server), we call the backend directly.
const API_BASE = new URL(BACKEND_URL).port === location.port ? '' : BACKEND_URL;

export const getToken = () => { try { return localStorage.getItem('token'); } catch { return null; } };
export const setToken = (t) => { try { localStorage.setItem('token', t); } catch {} };
export const clearToken = () => { try { localStorage.removeItem('token'); } catch {} };

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(API_BASE + '/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const e = new Error('Cannot reach the server. Is the backend running? (cd server, then npm start)');
    e.network = true;
    throw e;
  }
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    // Session ended: go back to the login page (but not while logging in)
    if (res.status === 401 && !path.startsWith('/auth/')) {
      clearToken();
      location.href = 'login.html';
    }
    throw new Error((data && data.error) || `Server error (${res.status})`);
  }
  return data;
}

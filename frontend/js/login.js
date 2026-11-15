import { api, getToken, setToken, clearToken } from './api.js';
import { emailError } from './validators.js';

// Already logged in? Go straight to the dashboard.
if (getToken()) {
  api('/auth/me').then(() => location.replace('index.html')).catch(() => clearToken());
}

// Decoration: a small week of colored glass tiles
const hues = [210, 160, 40, 320, 270];
const pattern = [1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0];
document.getElementById('mini').innerHTML = pattern
  .map((on, i) => (on ? `<i style="--h:${hues[(i * 3 + Math.floor(i / 5)) % hues.length]}"></i>` : '<i class="empty"></i>'))
  .join('');

const form = document.getElementById('form');
const err = document.getElementById('server-err');
const email = form.elements.email;
const password = form.elements.password;
const btn = document.getElementById('submit');

document.getElementById('toggle').addEventListener('click', (e) => {
  const show = password.type === 'password';
  password.type = show ? 'text' : 'password';
  e.target.textContent = show ? 'Hide' : 'Show';
});
email.addEventListener('blur', () => { document.getElementById('err-email').textContent = emailError(email.value.trim()); });

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  err.innerHTML = '';
  const eMsg = emailError(email.value.trim());
  const pMsg = password.value ? '' : 'Password is required';
  document.getElementById('err-email').textContent = eMsg;
  document.getElementById('err-password').textContent = pMsg;
  if (eMsg || pMsg) return;

  btn.disabled = true; btn.textContent = 'Logging in...';
  try {
    const data = await api('/auth/login', { method: 'POST', body: { email: email.value.trim(), password: password.value } });
    setToken(data.token);
    location.href = 'index.html';
  } catch (e) {
    err.innerHTML = '<div class="alert error"></div>';
    err.firstChild.textContent = e.message;
    btn.disabled = false; btn.textContent = 'Log in';
  }
});

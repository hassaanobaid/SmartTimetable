import { api, setToken } from './api.js';
import { bindChecklist, emailError, nameError, passwordOk } from './validators.js';

const form = document.getElementById('form');
const err = document.getElementById('server-err');
const btn = document.getElementById('submit');
const f = form.elements;
bindChecklist(document.getElementById('checklist'), f.password);

document.getElementById('toggle').addEventListener('click', (e) => {
  const show = f.password.type === 'password';
  f.password.type = f.confirm.type = show ? 'text' : 'password';
  e.target.textContent = show ? 'Hide' : 'Show';
});
f.email.addEventListener('blur', () => { document.getElementById('err-email').textContent = emailError(f.email.value.trim()); });

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  err.innerHTML = '';
  const errors = {
    full_name: nameError(f.full_name.value, 'Full name'),
    email: emailError(f.email.value.trim()),
    password: passwordOk(f.password.value) ? '' : 'Password does not meet all the rules below',
    confirm: f.confirm.value === f.password.value ? '' : 'Passwords do not match',
  };
  for (const [k, v] of Object.entries(errors)) document.getElementById('err-' + k).textContent = v;
  if (Object.values(errors).some(Boolean)) return;

  btn.disabled = true; btn.textContent = 'Creating account...';
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: { full_name: f.full_name.value.trim(), email: f.email.value.trim(), role: f.role.value, password: f.password.value },
    });
    setToken(data.token);
    location.href = 'index.html';
  } catch (e) {
    err.innerHTML = '<div class="alert error"></div>';
    err.firstChild.textContent = e.message;
    btn.disabled = false; btn.textContent = 'Register';
  }
});

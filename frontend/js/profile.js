// Profile page: two database-connected forms (change name, change password) with validation.
import { api, setToken } from './api.js';
import { initPage } from './shell.js';
import { esc, say } from './ui.js';
import { bindChecklist, nameError, passwordOk } from './validators.js';

const { user, main } = await initPage('profile.html');
main.innerHTML = `
  <header class="page-head"><h1>My profile</h1>
    <p class="muted">Signed in as <b>${esc(user.email)}</b> <span class="badge role-${esc(user.role)}">${esc(user.role)}</span></p></header>
  <div id="msg"></div>

  <form class="panel form-grid" id="nameForm" novalidate>
    <h2 class="span-all">Display name</h2>
    <label class="span-all"><span>Full name *</span>
      <input name="full_name" value="${esc(user.full_name)}" autocomplete="name">
      <small class="field-error" id="err-full_name"></small></label>
    <div class="span-all row"><button class="btn primary" type="submit">Save name</button></div>
  </form>

  <form class="panel form-grid" id="pwForm" novalidate>
    <h2 class="span-all">Change password</h2>
    <label><span>Current password *</span>
      <input name="current_password" type="password" autocomplete="current-password">
      <small class="field-error" id="err-current_password"></small></label>
    <label><span>New password *</span>
      <input name="new_password" type="password" autocomplete="new-password">
      <small class="field-error" id="err-new_password"></small></label>
    <label><span>Confirm new password *</span>
      <input name="confirm" type="password" autocomplete="new-password">
      <small class="field-error" id="err-confirm"></small></label>
    <ul class="checklist span-all" id="checklist"></ul>
    <div class="span-all row"><button class="btn primary" type="submit">Change password</button></div>
  </form>`;

const msg = main.querySelector('#msg');
const nameForm = main.querySelector('#nameForm');
const pwForm = main.querySelector('#pwForm');
const setErr = (id, text) => { main.querySelector('#err-' + id).textContent = text || ''; };
bindChecklist(main.querySelector('#checklist'), pwForm.elements.new_password);

nameForm.addEventListener('input', () => setErr('full_name', nameError(nameForm.elements.full_name.value, 'Full name')));
nameForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  say(msg, '', '');
  const e = nameError(nameForm.elements.full_name.value, 'Full name');
  setErr('full_name', e);
  if (e) return;
  try {
    const data = await api('/auth/me', { method: 'PUT', body: { full_name: nameForm.elements.full_name.value.trim() } });
    setToken(data.token);
    say(msg, 'success', 'Name updated.');
    document.querySelectorAll('.me-name').forEach((n) => { n.textContent = data.user.full_name; });
  } catch (x) { say(msg, 'error', x.message); }
});

pwForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  say(msg, '', '');
  const f = pwForm.elements;
  const errs = {
    current_password: f.current_password.value ? '' : 'Current password is required',
    new_password: passwordOk(f.new_password.value) ? '' : 'Password does not meet all the rules below',
    confirm: f.confirm.value === f.new_password.value ? '' : 'Passwords do not match',
  };
  if (!errs.new_password && f.new_password.value === f.current_password.value) errs.new_password = 'New password must be different from the current one';
  for (const [k, v] of Object.entries(errs)) setErr(k, v);
  if (Object.values(errs).some(Boolean)) return;
  try {
    await api('/auth/password', { method: 'PUT', body: { current_password: f.current_password.value, new_password: f.new_password.value } });
    pwForm.reset();
    bindChecklist(main.querySelector('#checklist'), f.new_password);
    say(msg, 'success', 'Password changed.');
  } catch (x) { say(msg, 'error', x.message); }
});

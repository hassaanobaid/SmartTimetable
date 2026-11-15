// Admin-only page: shows the activity_log table (filled by the Observer pattern on the server).
import { api } from './api.js';
import { initPage } from './shell.js';
import { esc, say } from './ui.js';

const { isAdmin, main } = await initPage('activity.html');
main.innerHTML = `
  <header class="page-head"><h1>Activity log</h1>
    <p class="muted">Every add, edit, delete, login and timetable generation is recorded here automatically.</p></header>
  <div id="msg"></div>
  <section class="panel row">
    <button class="btn" id="refresh" type="button">Refresh</button>
    <button class="btn danger" id="clear" type="button">Clear log</button>
  </section>
  <section class="panel table-wrap" id="list"><p class="muted">Loading...</p></section>`;

const msg = main.querySelector('#msg');
const list = main.querySelector('#list');

if (!isAdmin) {
  main.querySelector('.row').remove();
  list.remove();
  say(msg, 'warn', 'Only an admin can see the activity log.');
} else {
  const when = (t) => new Date(t).toLocaleString();
  async function load() {
    try {
      const rows = await api('/activity?limit=100');
      list.innerHTML = rows.length
        ? `<table><thead><tr><th>When</th><th>User</th><th>Action</th><th>Where</th><th>Details</th></tr></thead><tbody>
           ${rows.map((r) => `<tr><td>${esc(when(r.created_at))}</td><td>${esc(r.user_name || 'system')}</td>
             <td><span class="badge act-${esc(r.action)}">${esc(r.action)}</span></td><td>${esc(r.entity)}</td><td>${esc(r.details || '')}</td></tr>`).join('')}
           </tbody></table>`
        : '<p class="muted">Nothing recorded yet. Add or edit something and it will appear here.</p>';
    } catch (e) { list.innerHTML = ''; say(msg, 'error', e.message); }
  }
  main.querySelector('#refresh').addEventListener('click', load);
  main.querySelector('#clear').addEventListener('click', async () => {
    if (!confirm('Delete the whole activity log?')) return;
    try { await api('/activity', { method: 'DELETE' }); await load(); say(msg, 'success', 'Log cleared.'); }
    catch (e) { say(msg, 'error', e.message); }
  });
  await load();
}

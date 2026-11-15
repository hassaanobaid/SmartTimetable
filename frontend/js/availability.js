import { api } from './api.js';
import { initPage } from './shell.js';
import { esc, say } from './ui.js';
import { slotGrid } from './slot-grid.js';

const { isAdmin, main } = await initPage('availability.html');
main.innerHTML = `
  <header class="page-head"><h1>Teacher availability</h1>
    <p class="muted">Tick the slots where the teacher is <b>not available</b>. The scheduler never places that teacher's classes there. You can also describe it in words on the AI assistant page.</p></header>
  <div id="msg"></div>
  <section class="panel row">
    <label class="inline">Teacher
      <select id="teacher"><option value="">-- select teacher --</option></select></label>
    ${isAdmin ? '<button class="btn primary" id="save" hidden>Save availability</button>' : ''}
  </section>
  <section class="panel" id="gridbox" hidden></section>`;

const msg = main.querySelector('#msg');
const sel = main.querySelector('#teacher');
const box = main.querySelector('#gridbox');
const saveBtn = main.querySelector('#save');
let slots = [];
let busy = new Set();

try {
  const [teachers, s] = await Promise.all([api('/teachers'), api('/time-slots')]);
  slots = s;
  sel.insertAdjacentHTML('beforeend', teachers.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join(''));
} catch (e) { say(msg, 'error', e.message); }

function drawGrid() {
  box.innerHTML = '';
  box.append(slotGrid(slots, (slot) => {
    const label = document.createElement('label');
    label.className = 'busy-cell' + (busy.has(slot.id) ? ' on' : '');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = busy.has(slot.id);
    cb.disabled = !isAdmin;
    const text = document.createElement('span');
    text.textContent = cb.checked ? 'Not available' : 'Free';
    cb.addEventListener('change', () => {
      cb.checked ? busy.add(slot.id) : busy.delete(slot.id);
      label.classList.toggle('on', cb.checked);
      text.textContent = cb.checked ? 'Not available' : 'Free';
    });
    label.append(cb, text);
    return label;
  }));
}

sel.addEventListener('change', async () => {
  say(msg, '', '');
  if (!sel.value) { box.hidden = true; if (saveBtn) saveBtn.hidden = true; return; }
  try {
    busy = new Set((await api(`/availability/${sel.value}`)).slotIds);
    drawGrid();
    box.hidden = false;
    if (saveBtn) saveBtn.hidden = false;
  } catch (e) { say(msg, 'error', e.message); }
});

if (saveBtn) saveBtn.addEventListener('click', async () => {
  try {
    await api(`/availability/${sel.value}`, { method: 'PUT', body: { slotIds: [...busy] } });
    say(msg, 'success', 'Availability saved. Generate the timetable again to use it.');
  } catch (e) { say(msg, 'error', e.message); }
});

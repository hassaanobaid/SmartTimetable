import { api } from './api.js';
import { initPage } from './shell.js';
import { esc, say } from './ui.js';
import { slotGrid } from './slot-grid.js';

const { isAdmin, main } = await initPage('timetable.html');
main.innerHTML = `
  <header class="page-head"><h1>Timetable</h1></header>
  <div id="msg"></div>
  ${isAdmin ? `<section class="panel row">
      <button class="btn primary" id="gen">Generate timetable</button>
      <button class="btn" id="clear">Clear timetable</button>
      <span class="muted">Generating replaces the current timetable.</span></section>` : ''}
  <div id="result"></div>
  <section class="panel row">
    <label class="inline">View by
      <select id="mode"><option value="section">Section</option><option value="teacher">Teacher</option><option value="room">Room</option></select></label>
    <select id="target" aria-label="Choose"><option value="">-- select --</option></select>
  </section>
  <p class="muted" id="empty" hidden></p>
  <section class="panel" id="gridbox" hidden></section>`;

const msg = main.querySelector('#msg');
const resultEl = main.querySelector('#result');
const modeEl = main.querySelector('#mode');
const targetEl = main.querySelector('#target');
const boxEl = main.querySelector('#gridbox');
const emptyEl = main.querySelector('#empty');
const genBtn = main.querySelector('#gen');
const clearBtn = main.querySelector('#clear');

let slots = [], entries = [], lists = { section: [], teacher: [], room: [] };
let codes = [];

// Every course code gets its own color, spread evenly around the color wheel (golden angle).
const hueOf = (code) => (codes.indexOf(code) * 137.508) % 360;

const others = {
  section: (e) => `${e.teacher_name} | ${e.room_name}`,
  teacher: (e) => `${e.section_name} | ${e.room_name}`,
  room: (e) => `${e.section_name} | ${e.teacher_name}`,
};

async function load() {
  try {
    const [s, e, sec, t, r] = await Promise.all([api('/time-slots'), api('/timetable'), api('/sections'), api('/teachers'), api('/rooms')]);
    slots = s; entries = e; lists = { section: sec, teacher: t, room: r };
    codes = [...new Set(e.map((x) => x.code))].sort();
    say(msg, '', '');
  } catch (x) { say(msg, 'error', x.message); }
  fillTargets();
  draw();
}

function fillTargets() {
  const mode = modeEl.value;
  targetEl.innerHTML = `<option value="">-- select ${mode} --</option>` + lists[mode].map((i) => `<option value="${i.id}">${esc(i.name)}</option>`).join('');
  emptyEl.hidden = entries.length > 0;
  emptyEl.textContent = `No timetable yet. ${isAdmin ? 'Click Generate timetable.' : 'Ask an admin to generate it.'}`;
}

function draw() {
  boxEl.innerHTML = '';
  if (!targetEl.value) { boxEl.hidden = true; return; }
  const mode = modeEl.value;
  boxEl.append(slotGrid(slots, (slot) => {
    const here = entries.filter((e) => e.slot_id === slot.id && e[mode + '_id'] === Number(targetEl.value));
    if (!here.length) return null;
    const frag = document.createDocumentFragment();
    for (const e of here) {
      const div = document.createElement('div');
      div.className = 'tile';
      div.style.setProperty('--h', hueOf(e.code));
      div.innerHTML = `${e.is_lab ? '<span class="tag">Lab</span>' : ''}<b>${esc(e.code)}</b> ${esc(e.course_name)}<small>${esc(others[mode](e))}</small>`;
      frag.append(div);
    }
    return frag;
  }));
  boxEl.hidden = false;
}

function showResult(r) {
  const kind = r.unplaced.length ? 'warn' : 'success';
  resultEl.innerHTML = `<div class="alert ${kind}"><b>Placed ${r.placed} of ${r.total} classes</b> in ${r.ms} ms. Section gaps: ${r.gaps}.
    ${r.threads ? `<div class="threads">${r.threads.map((t) => `<div class="thread${t.strategy === r.winner ? ' win' : ''}">
        <b>Thread ${esc(t.threadId)}: ${esc(t.strategy)}</b>${t.strategy === r.winner ? '<span class="pill on">winner</span>' : ''}
        <small>${esc(t.placed)}/${esc(t.total)} placed, ${esc(t.gaps)} gaps, ${esc(t.steps)} steps, ${esc(t.ms)} ms</small></div>`).join('')}</div>` : ''}
    ${r.unplaced.length ? `<ul>${r.unplaced.map((u) => `<li>${esc(u.code)} ${esc(u.name)} (${esc(u.section)}, ${esc(u.teacher)}): ${esc(u.reason)}</li>`).join('')}</ul>
    <div style="margin-top:8px">Not sure how to fix it? <a href="ai.html">Ask the AI assistant</a>.</div>` : ''}</div>`;
}

modeEl.addEventListener('change', () => { fillTargets(); draw(); });
targetEl.addEventListener('change', draw);

if (genBtn) genBtn.addEventListener('click', async () => {
  genBtn.disabled = true; genBtn.textContent = 'Generating...';
  try { showResult(await api('/timetable/generate', { method: 'POST' })); await load(); }
  catch (x) { say(msg, 'error', x.message); }
  genBtn.disabled = false; genBtn.textContent = 'Generate timetable';
});
if (clearBtn) clearBtn.addEventListener('click', async () => {
  if (!confirm('Delete the generated timetable?')) return;
  try { await api('/timetable', { method: 'DELETE' }); resultEl.innerHTML = ''; await load(); }
  catch (x) { say(msg, 'error', x.message); }
});

await load();

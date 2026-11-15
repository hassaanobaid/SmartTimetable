import { api } from './api.js';
import { initPage } from './shell.js';
import { esc, say } from './ui.js';

const { isAdmin, main } = await initPage('ai.html');
main.innerHTML = `
  <header class="page-head">
    <h1>AI assistant</h1>
    <p class="muted">Describe changes in plain English or ask questions about your timetable. The AI only reads your department data and never saves anything without your confirmation.</p>
  </header>
  <div id="status" class="status" style="margin-bottom:18px"><span class="dot"></span><span>Checking the AI service...</span></div>

  <section class="panel" id="avail">
    <h2>Change availability by typing</h2>
    ${isAdmin ? `
      <textarea id="text" maxlength="500" placeholder="Example: Dr. Ahmed Khan is not available on Monday morning"></textarea>
      <div class="chips" id="examples"></div>
      <div class="row"><button class="btn primary" id="preview">Preview changes</button></div>
      <div id="avail-msg" style="margin-top:12px"></div>
      <div id="proposals"></div>`
      : '<p class="muted">Only an admin can change availability. You can still ask questions below.</p>'}
  </section>

  <section class="panel">
    <h2>Ask about the timetable</h2>
    <div class="chips" id="quick"></div>
    <div class="chat" id="chat"></div>
    <div class="ask-row">
      <input id="q" maxlength="1000" placeholder="Ask a question, for example: Which teacher has the most classes?" autocomplete="off">
      <button class="btn primary" id="ask">Ask</button>
    </div>
  </section>`;

// ----- AI service status
(async () => {
  const el = main.querySelector('#status');
  const set = (cls, text) => { el.innerHTML = `<span class="dot ${cls}"></span><span>${esc(text)}</span>`; };
  try {
    const s = await api('/ai/status');
    if (!s.online) set('bad', 'AI service is not running. Open a terminal in the ai-service folder and run: python app.py');
    else if (!s.configured) set('warn', 'AI service is running but has no API key. Paste your key in ai-service/.env and restart it.');
    else set('ok', `AI service is ready (${s.provider}, ${s.model})`);
  } catch (e) { set('bad', e.message); }
})();

// ----- availability by text
if (isAdmin) {
  const text = main.querySelector('#text');
  const msg = main.querySelector('#avail-msg');
  const box = main.querySelector('#proposals');
  const previewBtn = main.querySelector('#preview');
  let proposals = [];

  const examples = ['Ms. Sara Ali cannot come on Friday afternoon', 'Dr. Ahmed Khan is not available on Monday and Tuesday', 'Mr. Bilal Hussain is free again on Monday'];
  main.querySelector('#examples').innerHTML = examples.map((e) => `<button type="button" class="chip">${esc(e)}</button>`).join('');
  main.querySelector('#examples').addEventListener('click', (ev) => {
    if (ev.target.classList.contains('chip')) { text.value = ev.target.textContent; text.focus(); }
  });

  const byDay = (slots) => {
    const m = new Map();
    slots.forEach((s) => { if (!m.has(s.day)) m.set(s.day, []); m.get(s.day).push(`${s.start}-${s.end}`); });
    return [...m].map(([d, t]) => `${d}: ${t.join(', ')}`).join('  |  ');
  };

  function drawProposals(warnings) {
    box.innerHTML = '';
    if (warnings.length)
      msg.innerHTML = `<div class="alert warn"><ul>${warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>`;
    if (!proposals.length) return;
    box.innerHTML = `<p class="muted">The AI understood this. Check it, then apply:</p>
      ${proposals.map((p) => `<div class="proposal"><b>${esc(p.teacher_name)}</b>
        <span class="pill ${p.action === 'unavailable' ? 'off' : 'on'}">${p.action === 'unavailable' ? 'not available' : 'available again'}</span>
        <p>${esc(byDay(p.slots))}</p></div>`).join('')}
      <div class="row"><button class="btn primary" id="apply">Apply changes</button><button class="btn" id="discard">Discard</button></div>`;
    box.querySelector('#discard').addEventListener('click', () => { proposals = []; box.innerHTML = ''; });
    box.querySelector('#apply').addEventListener('click', async (ev) => {
      ev.target.disabled = true;
      try {
        const r = await api('/ai/apply-availability', {
          method: 'POST',
          body: { changes: proposals.map((p) => ({ teacher_id: p.teacher_id, action: p.action, slot_ids: p.slot_ids })) },
        });
        proposals = []; box.innerHTML = '';
        msg.innerHTML = `<div class="alert success">Saved (${r.added} slots blocked, ${r.removed} slots freed). Go to <a href="timetable.html">Timetable</a> and generate it again to use the change.</div>`;
      } catch (e) { say(msg, 'error', e.message); ev.target.disabled = false; }
    });
  }

  previewBtn.addEventListener('click', async () => {
    say(msg, '', ''); box.innerHTML = ''; proposals = [];
    if (!text.value.trim()) { say(msg, 'error', 'Type what you want to change first.'); return; }
    previewBtn.disabled = true; previewBtn.textContent = 'Thinking...';
    try {
      const r = await api('/ai/parse-availability', { method: 'POST', body: { text: text.value.trim() } });
      proposals = r.proposals;
      drawProposals(r.warnings);
    } catch (e) { say(msg, 'error', e.message); }
    previewBtn.disabled = false; previewBtn.textContent = 'Preview changes';
  });
}

// ----- chat
const chat = main.querySelector('#chat');
const q = main.querySelector('#q');
const askBtn = main.querySelector('#ask');
const history = [];

const quick = ['Check my data for problems', 'Why could some classes not be placed?', 'Which teacher has the most classes?'];
main.querySelector('#quick').innerHTML = quick.map((t) => `<button type="button" class="chip">${esc(t)}</button>`).join('');
main.querySelector('#quick').addEventListener('click', (ev) => {
  if (ev.target.classList.contains('chip')) { q.value = ev.target.textContent; send(); }
});

function bubble(kind, text) {
  const d = document.createElement('div');
  d.className = 'bubble ' + kind;
  d.textContent = text;
  chat.append(d);
  chat.scrollTop = chat.scrollHeight;
  return d;
}

async function send() {
  const question = q.value.trim();
  if (!question || askBtn.disabled) return;
  q.value = '';
  bubble('user', question);
  const wait = bubble('ai', 'Thinking...');
  askBtn.disabled = true;
  try {
    const r = await api('/ai/ask', { method: 'POST', body: { question, history: history.slice(-6) } });
    wait.textContent = r.answer;
    history.push({ role: 'user', content: question }, { role: 'assistant', content: r.answer });
  } catch (e) {
    wait.className = 'bubble err';
    wait.textContent = e.message;
  }
  askBtn.disabled = false;
  chat.scrollTop = chat.scrollHeight;
  q.focus();
}
askBtn.addEventListener('click', send);
q.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

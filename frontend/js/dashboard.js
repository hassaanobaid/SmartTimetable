import { api } from './api.js';
import { initPage } from './shell.js';
import { esc, say } from './ui.js';

const { user, main } = await initPage('index.html');
main.innerHTML = `
  <header class="page-head"><h1>Welcome, ${esc(user.full_name)}</h1>
    <p class="muted">Everything about your department's timetable in one place.</p></header>
  <div id="msg"></div>
  <section class="panel overview" id="overview"><p class="muted" style="padding:0 22px">Loading...</p></section>
  <section class="panel">
    <h2>How to build a timetable</h2>
    <ol class="steps">
      <li>Add <b>Teachers</b>, <b>Sections</b> and <b>Rooms</b>. Mark lab rooms as labs.</li>
      <li>Add <b>Courses</b>: which teacher teaches which course to which section.</li>
      <li>Set teacher <b>Availability</b> for anyone who is busy at certain times. You can also type it in the AI assistant.</li>
      <li>Open <b>Timetable</b> and click Generate timetable.</li>
      <li>View the result by section, teacher or room.</li>
    </ol>
    ${user.role !== 'admin' ? `<p class="muted">You are logged in as ${esc(user.role)}: you can view data and timetables. Only admins can change them.</p>` : ''}
  </section>
  <section class="panel">
    <h2>Ask the AI assistant</h2>
    <p class="muted">Ask about the timetable in plain English, or type "Dr. Ahmed is not available on Monday morning" and let the AI prepare the change.</p>
    <a class="btn primary" href="ai.html" style="display:inline-block;text-decoration:none">Open AI assistant</a>
  </section>`;

try {
  const s = await api('/stats');
  const items = [['teachers', 'Teachers', 'teachers.html'], ['sections', 'Sections', 'sections.html'], ['rooms', 'Rooms', 'rooms.html'],
    ['courses', 'Courses', 'courses.html'], ['slots', 'Time slots', 'time-slots.html'], ['entries', 'Classes in timetable', 'timetable.html']];
  document.getElementById('overview').innerHTML = items
    .map(([k, label, href]) => `<a class="metric" href="${href}"><span class="num">${esc(s[k])}</span><small>${label}</small></a>`).join('');
} catch (e) {
  document.getElementById('overview').remove();
  say(document.getElementById('msg'), 'error', e.message);
}

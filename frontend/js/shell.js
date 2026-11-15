// The sidebar and page frame shared by every page after login.
import { api, getToken, clearToken } from './api.js';
import { esc } from './ui.js';

const TABS = [
  ['index.html', 'Dashboard', '🏠'],
  ['teachers.html', 'Teachers', '👩‍🏫'],
  ['sections.html', 'Sections', '👥'],
  ['rooms.html', 'Rooms', '🚪'],
  ['courses.html', 'Courses', '📚'],
  ['time-slots.html', 'Time slots', '🕒'],
  ['availability.html', 'Availability', '🗓️'],
  ['timetable.html', 'Timetable', '🧩'],
  ['ai.html', 'AI assistant', '✨'],
  ['activity.html', 'Activity log', '📜', 'admin'],   // 4th value: only this role sees the tab
  ['profile.html', 'My profile', '👤'],
];

const goLogin = () => { clearToken(); location.replace('login.html'); return new Promise(() => {}); };

// Call at the start of every protected page. Returns { user, isAdmin, main }.
export async function initPage(active) {
  if (!getToken()) return goLogin();
  const shell = document.getElementById('shell');
  let user;
  try {
    user = await api('/auth/me');
  } catch (e) {
    if (e.network) {
      shell.innerHTML = `<div class="auth-page"><div class="panel"><h2>Server not reachable</h2><p>${esc(e.message)}</p></div></div>`;
      return new Promise(() => {});
    }
    return goLogin();
  }

  const tab = TABS.find((t) => t[0] === active);
  document.title = `${tab ? tab[1] : 'Page'} - Smart Timetable`;
  shell.innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <div class="brand">
          <span class="logo"><i style="--h:210"></i><i style="--h:160"></i><i style="--h:40"></i><i style="--h:320"></i></span>
          <div><b>Smart Timetable</b><small>Generator</small></div>
        </div>
        <nav class="nav">
          ${TABS.filter((t) => !t[3] || t[3] === user.role).map(([file, label, ico]) => `<a href="${file}" class="${file === active ? 'active' : ''}"><span class="ico">${ico}</span>${label}</a>`).join('')}
        </nav>
        <div class="me">
          <div class="me-name">${esc(user.full_name)}</div>
          <span class="badge role-${esc(user.role)}">${esc(user.role)}</span>
          <button class="btn small" id="logout" type="button">Log out</button>
        </div>
      </aside>
      <main class="content" id="content"></main>
    </div>`;
  document.getElementById('logout').addEventListener('click', goLogin);
  return { user, isAdmin: user.role === 'admin', main: document.getElementById('content') };
}

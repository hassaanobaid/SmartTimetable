// Weekly grid: columns = days, rows = time ranges. renderCell(slot) fills each cell.
import { hhmm } from './ui.js';

const ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function slotGrid(slots, renderCell) {
  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  if (!slots.length) {
    wrap.innerHTML = '<p class="muted">No time slots yet. Add them in the Time slots tab.</p>';
    return wrap;
  }
  const range = (s) => `${hhmm(s.start_time)}-${hhmm(s.end_time)}`;
  const days = [...new Set(slots.map((s) => s.day))].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const times = [...new Set(slots.map(range))].sort();

  const table = document.createElement('table');
  table.className = 'grid';
  const head = table.createTHead().insertRow();
  head.insertCell().outerHTML = '<th>Time</th>';
  days.forEach((d) => { head.insertCell().outerHTML = `<th>${d}</th>`; });

  const body = table.createTBody();
  for (const t of times) {
    const tr = body.insertRow();
    tr.insertCell().outerHTML = `<th>${t.replace('-', ' - ')}</th>`;
    for (const d of days) {
      const td = tr.insertCell();
      const slot = slots.find((s) => s.day === d && range(s) === t);
      const content = slot ? renderCell(slot) : null;
      if (content instanceof Node) td.append(content);
      else td.innerHTML = '<span class="muted">-</span>';
    }
  }
  wrap.append(table);
  return wrap;
}

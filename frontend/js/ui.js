// Small helpers shared by all pages.
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const hhmm = (t) => String(t).slice(0, 5);

// Shows (or clears) a message box inside `el`. kind: success | error | warn | info
export function say(el, kind, text) {
  el.innerHTML = text ? `<div class="alert ${kind}">${esc(text)}</div>` : '';
}

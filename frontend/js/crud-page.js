// One reusable list + add/edit/delete page. Teachers, Sections, Rooms, Courses and Time slots all use it.
import { api } from './api.js';
import { initPage } from './shell.js';
import { esc, hhmm, say } from './ui.js';
import { emailError, nameError } from './validators.js';

function fieldHTML(f) {
  if (f.type === 'checkbox')
    return `<label class="check"><input type="checkbox" name="${f.name}"> ${esc(f.label)}</label>`;
  const control = f.type === 'select'
    ? `<select name="${f.name}"><option value="">-- select --</option></select>`
    : `<input name="${f.name}" autocomplete="off" type="${f.type === 'number' ? 'number' : f.type === 'time' ? 'time' : 'text'}"
        ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''}>`;
  return `<label><span>${esc(f.label)}${f.required ? ' *' : ''}</span>${control}<small class="field-error" data-err="${f.name}"></small></label>`;
}

export async function crudPage({ active, title, hint, endpoint, columns, fields }) {
  const { isAdmin, main } = await initPage(active);
  main.innerHTML = `
    <header class="page-head"><h1>${esc(title)}</h1>${hint ? `<p class="muted">${esc(hint)}</p>` : ''}</header>
    <div id="msg"></div>
    ${isAdmin
      ? `<form id="form" class="panel form-grid" novalidate>
           <h2 class="span-all" id="form-title">Add new</h2>
           ${fields.map(fieldHTML).join('')}
           <div class="span-all row">
             <button class="btn primary" type="submit" id="save">Add</button>
             <button class="btn" type="button" id="cancel" hidden>Cancel</button>
           </div>
         </form>`
      : '<div class="alert info">View only. Only an admin can add or change data.</div>'}
    <section class="panel table-wrap" id="list"><p class="muted">Loading...</p></section>`;

  const msgEl = main.querySelector('#msg');
  const listEl = main.querySelector('#list');
  const form = main.querySelector('#form');
  let rows = [];
  let editId = null;

  const ctl = (name) => form.elements.namedItem(name);

  // ----- dropdowns (static options, or loaded from the server)
  async function fillSelects() {
    for (const f of fields.filter((x) => x.type === 'select')) {
      let options = f.options;
      if (!options) {
        try {
          options = (await api(f.optionsEndpoint)).map((o) => ({ value: o.id, label: f.optionLabel(o) }));
        } catch { options = []; }
      }
      ctl(f.name).insertAdjacentHTML('beforeend', options.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join(''));
    }
  }

  const readValues = () => Object.fromEntries(fields.map((f) => {
    const el = ctl(f.name);
    return [f.name, f.type === 'checkbox' ? el.checked : el.value.trim()];
  }));

  function validate(v) {
    const errors = {};
    for (const f of fields) {
      const val = v[f.name];
      const blank = val === '' || val == null;
      if (f.required && blank && f.type !== 'checkbox') { errors[f.name] = `${f.label} is required`; continue; }
      if (blank) continue;
      if (f.type === 'text' && String(val).length > (f.max || 100)) { errors[f.name] = `${f.label} is too long (maximum ${f.max || 100} characters)`; continue; }
      if (f.type === 'email' && emailError(val)) errors[f.name] = emailError(val);
      if (f.alpha && nameError(val, f.label)) errors[f.name] = nameError(val, f.label);
      if (f.type === 'number') {
        const n = Number(val);
        if (!Number.isInteger(n) || n < (f.min ?? 1) || (f.max && n > f.max))
          errors[f.name] = `Enter a whole number${f.max ? ` from ${f.min ?? 1} to ${f.max}` : ''}`;
      }
    }
    if (v.start_time && v.end_time && v.end_time <= v.start_time) errors.end_time = 'End time must be after start time';
    form.querySelectorAll('[data-err]').forEach((el) => { el.textContent = errors[el.dataset.err] || ''; });
    return !Object.keys(errors).length;
  }

  // Live feedback: re-check a field while the user types, once it has been touched
  function liveCheck(ev) {
    const t = ev.target;
    if (!t.name) return;
    const touched = (form._touched = form._touched || new Set());
    touched.add(t.name);
    const v = readValues();
    validate(v);
    form.querySelectorAll('[data-err]').forEach((el) => { if (!touched.has(el.dataset.err) && !form._submitted) el.textContent = ''; });
  }

  function resetForm() {
    form._touched = new Set(); form._submitted = false;
    editId = null;
    form.reset();
    form.querySelectorAll('[data-err]').forEach((el) => { el.textContent = ''; });
    main.querySelector('#form-title').textContent = 'Add new';
    main.querySelector('#save').textContent = 'Add';
    main.querySelector('#cancel').hidden = true;
  }

  function startEdit(row) {
    editId = row.id;
    say(msgEl, '', '');
    for (const f of fields) {
      let v = row[f.name];
      if (f.type === 'time') v = hhmm(v);
      if (f.type === 'checkbox') ctl(f.name).checked = !!v;
      else ctl(f.name).value = v ?? '';
    }
    main.querySelector('#form-title').textContent = 'Edit record';
    main.querySelector('#save').textContent = 'Save changes';
    main.querySelector('#cancel').hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ----- the table
  function drawList() {
    if (!rows.length) {
      listEl.innerHTML = `<p class="muted">No records yet.${isAdmin ? ' Use the form above to add one.' : ''}</p>`;
      return;
    }
    listEl.innerHTML = `<table>
      <thead><tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join('')}${isAdmin ? '<th></th>' : ''}</tr></thead>
      <tbody>${rows.map((r) => `<tr>
        ${columns.map((c) => `<td>${esc(c.render ? c.render(r) : (r[c.key] ?? '-'))}</td>`).join('')}
        ${isAdmin ? `<td class="actions"><button class="btn small" data-edit="${r.id}">Edit</button><button class="btn small danger" data-del="${r.id}">Delete</button></td>` : ''}
      </tr>`).join('')}</tbody></table>`;
  }

  async function load() {
    try { rows = await api(endpoint); drawList(); }
    catch (e) { listEl.innerHTML = ''; say(msgEl, 'error', e.message); }
  }

  listEl.addEventListener('click', async (ev) => {
    const edit = ev.target.closest('[data-edit]');
    const del = ev.target.closest('[data-del]');
    if (edit) startEdit(rows.find((r) => String(r.id) === edit.dataset.edit));
    if (del) {
      if (!confirm('Delete this record? Related data (like courses or timetable entries) may be removed too.')) return;
      try { await api(`${endpoint}/${del.dataset.del}`, { method: 'DELETE' }); await load(); say(msgEl, 'success', 'Deleted.'); }
      catch (e) { say(msgEl, 'error', e.message); }
    }
  });

  if (form) {
    await fillSelects();
    main.querySelector('#cancel').addEventListener('click', resetForm);
    form.addEventListener('input', liveCheck);
    form.addEventListener('change', liveCheck);
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      say(msgEl, '', '');
      form._submitted = true;
      const values = readValues();
      if (!validate(values)) return;
      try {
        await api(editId ? `${endpoint}/${editId}` : endpoint, { method: editId ? 'PUT' : 'POST', body: values });
        const verb = editId ? 'Updated' : 'Added';
        resetForm();
        await load();
        say(msgEl, 'success', `${verb} successfully.`);
      } catch (e) { say(msgEl, 'error', e.message); }
    });
  }
  await load();
}

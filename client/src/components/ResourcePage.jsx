import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { emailError } from '../validators';

// Generic list + add/edit/delete page used by Teachers, Sections, Rooms, Courses, Time Slots.
export default function ResourcePage({ title, endpoint, columns, fields, hint }) {
  const { isAdmin } = useAuth();
  const empty = Object.fromEntries(fields.map((f) => [f.name, f.type === 'checkbox' ? false : '']));
  const [rows, setRows] = useState([]);
  const [opts, setOpts] = useState({});
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setRows(await api(endpoint)); setErr(''); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    fields.filter((f) => f.optionsEndpoint).forEach(async (f) => {
      try { const d = await api(f.optionsEndpoint); setOpts((o) => ({ ...o, [f.name]: d })); } catch {}
    });
  }, []);

  const validate = () => {
    const e = {};
    for (const f of fields) {
      const v = form[f.name];
      const blank = v === '' || v === null || v === undefined;
      if (f.required && blank && f.type !== 'checkbox') { e[f.name] = `${f.label} is required`; continue; }
      if (blank) continue;
      if (f.type === 'email' && emailError(v)) e[f.name] = emailError(v);
      if (f.type === 'number') {
        const n = Number(v);
        if (!Number.isInteger(n) || n < (f.min ?? 1) || (f.max && n > f.max))
          e[f.name] = `Enter a whole number${f.max ? ` from ${f.min ?? 1} to ${f.max}` : ''}`;
      }
    }
    if (form.start_time && form.end_time && form.end_time <= form.start_time) e.end_time = 'End time must be after start time';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMsg(''); setErr('');
    if (!validate()) return;
    try {
      await api(editId ? `${endpoint}/${editId}` : endpoint, { method: editId ? 'PUT' : 'POST', body: form });
      setMsg(editId ? 'Updated successfully' : 'Added successfully');
      setForm(empty); setEditId(null); setErrors({});
      load();
    } catch (e) { setErr(e.message); }
  };

  const edit = (row) => {
    setEditId(row.id); setMsg(''); setErr(''); setErrors({});
    setForm(Object.fromEntries(fields.map((f) => {
      let v = row[f.name];
      if (f.type === 'checkbox') v = !!v;
      if (f.type === 'time') v = String(v).slice(0, 5);
      return [f.name, v ?? ''];
    })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (row) => {
    if (!window.confirm('Delete this record? Related data (like courses or timetable entries) may be removed too.')) return;
    try { await api(`${endpoint}/${row.id}`, { method: 'DELETE' }); setMsg('Deleted'); load(); }
    catch (e) { setErr(e.message); }
  };

  const set = (name, v) => setForm((f) => ({ ...f, [name]: v }));

  return (
    <div>
      <h1>{title}</h1>
      {hint && <p className="muted">{hint}</p>}
      {err && <div className="alert error">{err}</div>}
      {msg && <div className="alert success">{msg}</div>}

      {isAdmin ? (
        <form className="card form-grid" onSubmit={submit} noValidate>
          <h3 className="span-all">{editId ? 'Edit record' : 'Add new'}</h3>
          {fields.map((f) => (
            <label key={f.name} className={f.type === 'checkbox' ? 'check' : ''}>
              {f.type === 'checkbox' ? (
                <><input type="checkbox" checked={!!form[f.name]} onChange={(e) => set(f.name, e.target.checked)} /> {f.label}</>
              ) : (
                <>
                  <span>{f.label}{f.required && ' *'}</span>
                  {f.type === 'select' ? (
                    <select value={form[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                      <option value="">-- select --</option>
                      {(f.options || (opts[f.name] || []).map((o) => ({ value: o.id, label: f.optionLabel(o) }))).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : f.type === 'time' ? 'time' : 'text'}
                      value={form[f.name]} min={f.min} max={f.max}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                  )}
                </>
              )}
              {errors[f.name] && <small className="field-error">{errors[f.name]}</small>}
            </label>
          ))}
          <div className="span-all row">
            <button className="btn" type="submit">{editId ? 'Save changes' : 'Add'}</button>
            {editId && <button type="button" className="btn secondary" onClick={() => { setEditId(null); setForm(empty); setErrors({}); }}>Cancel</button>}
          </div>
        </form>
      ) : (
        <p className="alert info">View only: only an admin can add or change data.</p>
      )}

      <div className="card table-wrap">
        {loading ? <p>Loading...</p> : rows.length === 0 ? <p className="muted">No records yet.</p> : (
          <table>
            <thead>
              <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}{isAdmin && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : (r[c.key] ?? '-')}</td>)}
                  {isAdmin && (
                    <td className="actions">
                      <button className="btn small secondary" onClick={() => edit(r)}>Edit</button>
                      <button className="btn small danger" onClick={() => remove(r)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

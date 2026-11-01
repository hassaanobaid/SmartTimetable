import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import SlotGrid from '../components/SlotGrid';

export default function Availability() {
  const { isAdmin } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [busy, setBusy] = useState(new Set());
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([api('/teachers'), api('/time-slots')]).then(([t, s]) => { setTeachers(t); setSlots(s); }).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    api(`/availability/${teacherId}`).then((d) => setBusy(new Set(d.slotIds))).catch((e) => setErr(e.message));
    setMsg('');
  }, [teacherId]);

  const toggle = (id) => setBusy((b) => { const n = new Set(b); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const save = async () => {
    try { await api(`/availability/${teacherId}`, { method: 'PUT', body: { slotIds: [...busy] } }); setMsg('Availability saved'); setErr(''); }
    catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <h1>Teacher Availability</h1>
      <p className="muted">Tick the slots where the teacher is <b>NOT available</b>. The scheduler will never place that teacher's classes there.</p>
      {err && <div className="alert error">{err}</div>}
      {msg && <div className="alert success">{msg}</div>}
      <div className="card row">
        <label className="inline">Teacher:
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">-- select teacher --</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        {isAdmin && teacherId && <button className="btn" onClick={save}>Save availability</button>}
      </div>
      {teacherId && (
        <div className="card">
          <SlotGrid slots={slots} renderCell={(s) => (
            <label className={`busy-cell ${busy.has(s.id) ? 'on' : ''}`}>
              <input type="checkbox" disabled={!isAdmin} checked={busy.has(s.id)} onChange={() => toggle(s.id)} />
              {busy.has(s.id) ? 'Not available' : 'Free'}
            </label>
          )} />
        </div>
      )}
    </div>
  );
}

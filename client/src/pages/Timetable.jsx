import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import SlotGrid from '../components/SlotGrid';

export default function Timetable() {
  const { isAdmin } = useAuth();
  const [slots, setSlots] = useState([]);
  const [entries, setEntries] = useState([]);
  const [lists, setLists] = useState({ section: [], teacher: [], room: [] });
  const [mode, setMode] = useState('section');
  const [targetId, setTargetId] = useState('');
  const [result, setResult] = useState(null);
  const [working, setWorking] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      const [s, e, sec, t, r] = await Promise.all([api('/time-slots'), api('/timetable'), api('/sections'), api('/teachers'), api('/rooms')]);
      setSlots(s); setEntries(e); setLists({ section: sec, teacher: t, room: r }); setErr('');
    } catch (x) { setErr(x.message); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setTargetId(''); }, [mode]);

  const generate = async () => {
    setWorking(true); setErr('');
    try { setResult(await api('/timetable/generate', { method: 'POST' })); await load(); }
    catch (x) { setErr(x.message); }
    finally { setWorking(false); }
  };
  const clear = async () => {
    if (!window.confirm('Delete the generated timetable?')) return;
    try { await api('/timetable', { method: 'DELETE' }); setResult(null); load(); } catch (x) { setErr(x.message); }
  };

  const others = { section: (e) => `${e.teacher_name} | ${e.room_name}`, teacher: (e) => `${e.section_name} | ${e.room_name}`, room: (e) => `${e.section_name} | ${e.teacher_name}` };
  const items = lists[mode];

  return (
    <div>
      <h1>Timetable</h1>
      {err && <div className="alert error">{err}</div>}

      {isAdmin && (
        <div className="card row">
          <button className="btn" onClick={generate} disabled={working}>{working ? 'Generating...' : 'Generate Timetable'}</button>
          <button className="btn secondary" onClick={clear} disabled={!entries.length}>Clear timetable</button>
          <span className="muted">Generating replaces the existing timetable.</span>
        </div>
      )}

      {result && (
        <div className={`alert ${result.unplaced.length ? 'warn' : 'success'}`}>
          <b>Placed {result.placed} of {result.total} classes</b> in {result.ms} ms. Section gaps: {result.gaps}.
          {result.unplaced.length > 0 && (
            <ul>
              {result.unplaced.map((u, i) => (
                <li key={i}>{u.code} {u.name} ({u.section}, {u.teacher}): {u.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="card row">
        <label className="inline">View by:
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="section">Section</option>
            <option value="teacher">Teacher</option>
            <option value="room">Room</option>
          </select>
        </label>
        <label className="inline">
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">-- select {mode} --</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
      </div>

      {!entries.length && <p className="muted">No timetable yet. {isAdmin ? 'Click "Generate Timetable".' : 'Ask an admin to generate it.'}</p>}

      {targetId && (
        <div className="card">
          <SlotGrid slots={slots} renderCell={(s) => {
            const here = entries.filter((e) => e.slot_id === s.id && e[mode + '_id'] === Number(targetId));
            return here.length ? here.map((e) => (
              <div key={e.id} className={`class-box ${e.is_lab ? 'lab' : ''}`}>
                <b>{e.code}</b> {e.course_name}
                <small>{others[mode](e)}</small>
              </div>
            )) : <span className="muted">-</span>;
          }} />
        </div>
      )}
    </div>
  );
}

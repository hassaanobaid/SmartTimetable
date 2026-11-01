import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/stats').then(setStats).catch((e) => setErr(e.message)); }, []);

  const cards = stats && [
    ['Teachers', stats.teachers, '/teachers'], ['Sections', stats.sections, '/sections'], ['Rooms', stats.rooms, '/rooms'],
    ['Courses', stats.courses, '/courses'], ['Time slots', stats.slots, '/time-slots'], ['Timetable classes', stats.entries, '/timetable'],
  ];

  return (
    <div>
      <h1>Welcome, {user.full_name}</h1>
      {err && <div className="alert error">{err}</div>}
      <div className="stats">
        {cards ? cards.map(([label, n, to]) => (
          <Link key={label} to={to} className="stat"><span className="num">{n}</span>{label}</Link>
        )) : !err && <p>Loading...</p>}
      </div>
      <div className="card">
        <h3>How to use</h3>
        <ol>
          <li>Add <b>Teachers</b>, <b>Sections</b> and <b>Rooms</b> (mark lab rooms).</li>
          <li>Add <b>Courses</b>: which teacher teaches which course to which section.</li>
          <li>Optional: set <b>Availability</b> for teachers who are busy at some times.</li>
          <li>Open <b>Timetable</b> and click <b>Generate Timetable</b>.</li>
          <li>View the result by section, teacher or room.</li>
        </ol>
        {user.role !== 'admin' && <p className="muted">You are logged in as {user.role}: you can view data and timetables. Only admins can change them.</p>}
      </div>
    </div>
  );
}

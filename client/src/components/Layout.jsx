import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const TABS = [
  ['/', 'Dashboard'], ['/teachers', 'Teachers'], ['/sections', 'Sections'], ['/rooms', 'Rooms'],
  ['/courses', 'Courses'], ['/time-slots', 'Time Slots'], ['/availability', 'Availability'], ['/timetable', 'Timetable'],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Smart Timetable</h2>
        <nav>
          {TABS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <span>{user.full_name} <span className={`badge role-${user.role}`}>{user.role}</span></span>
          <button className="btn secondary" onClick={() => { logout(); nav('/login'); }}>Logout</button>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}

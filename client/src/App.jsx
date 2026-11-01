import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Courses from './pages/Courses';
import Rooms from './pages/Rooms';
import Sections from './pages/Sections';
import TimeSlots from './pages/TimeSlots';
import Availability from './pages/Availability';
import Timetable from './pages/Timetable';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-msg">Loading...</p>;
  return user ? children : <Navigate to="/login" replace />;
}
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-msg">Loading...</p>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/sections" element={<Sections />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/time-slots" element={<TimeSlots />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/timetable" element={<Timetable />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

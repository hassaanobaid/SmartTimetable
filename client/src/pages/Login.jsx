import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { emailError } from '../validators';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    const em = emailError(email.trim());
    if (em) er.email = em;
    if (!password) er.password = 'Password is required';
    setErrors(er); setServerErr('');
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await login(email.trim(), password); nav('/'); }
    catch (x) { setServerErr(x.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Smart Timetable Generator</h1>
        <p className="muted">Log in to continue</p>
        {serverErr && <div className="alert error">{serverErr}</div>}
        <label><span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setErrors((o) => ({ ...o, email: emailError(email.trim()) }))} placeholder="name@gmail.com" />
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>
        <label><span>Password</span>
          <div className="pw">
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            <button type="button" className="link-btn" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
          </div>
          {errors.password && <small className="field-error">{errors.password}</small>}
        </label>
        <button className="btn full" disabled={busy}>{busy ? 'Logging in...' : 'Login'}</button>
        <p className="center">No account? <Link to="/register">Register here</Link></p>
      </form>
    </div>
  );
}

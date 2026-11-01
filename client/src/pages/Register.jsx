import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { emailError, passwordOk } from '../validators';
import PasswordChecklist from '../components/PasswordChecklist';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', role: 'student', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (form.full_name.trim().length < 2) e.full_name = 'Enter your full name (at least 2 characters)';
    const em = emailError(form.email.trim());
    if (em) e.email = em;
    if (!passwordOk(form.password)) e.password = 'Password does not meet all the rules below';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerErr('');
    if (!validate()) return;
    setBusy(true);
    try {
      await register({ full_name: form.full_name.trim(), email: form.email.trim(), role: form.role, password: form.password });
      nav('/');
    } catch (x) { setServerErr(x.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Create account</h1>
        {serverErr && <div className="alert error">{serverErr}</div>}
        <label><span>Full name</span>
          <input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Hassaan Obaid" />
          {errors.full_name && <small className="field-error">{errors.full_name}</small>}
        </label>
        <label><span>Email</span>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} onBlur={() => setErrors((o) => ({ ...o, email: emailError(form.email.trim()) }))} placeholder="name@gmail.com" />
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>
        <label><span>I am a</span>
          <select value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="student">Student (view only)</option>
            <option value="teacher">Teacher (view only)</option>
            <option value="admin">Admin (can manage everything)</option>
          </select>
        </label>
        <label><span>Password</span>
          <div className="pw">
            <input type={show ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} />
            <button type="button" className="link-btn" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
          </div>
          {errors.password && <small className="field-error">{errors.password}</small>}
        </label>
        <PasswordChecklist password={form.password} />
        <label><span>Confirm password</span>
          <input type={show ? 'text' : 'password'} value={form.confirm} onChange={(e) => set('confirm', e.target.value)} />
          {errors.confirm && <small className="field-error">{errors.confirm}</small>}
        </label>
        <button className="btn full" disabled={busy}>{busy ? 'Creating...' : 'Register'}</button>
        <p className="center">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}

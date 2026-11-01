import { PASSWORD_RULES } from '../validators';

export default function PasswordChecklist({ password }) {
  return (
    <ul className="checklist">
      {PASSWORD_RULES.map((r) => (
        <li key={r.label} className={r.test(password) ? 'ok' : ''}>{r.test(password) ? '✔' : '○'} {r.label}</li>
      ))}
    </ul>
  );
}

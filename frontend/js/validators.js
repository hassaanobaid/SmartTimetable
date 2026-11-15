// Form checks. The server repeats the same checks (server/validators.js).

// Email: must contain @, a domain and an extension, like name@gmail.com
export const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function emailError(email) {
  if (!email) return 'Email is required';
  if (!email.includes('@')) return 'Email must contain the @ symbol';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email (example: name@gmail.com)';
  return '';
}

export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One capital letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'One small letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (! @ # $ % ...)', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { label: 'No spaces', test: (p) => !/\s/.test(p) },
];
export const passwordOk = (p) => PASSWORD_RULES.every((r) => r.test(p));

// Names: alphabets only. Spaces, dot, apostrophe and hyphen are allowed ("Dr. Ahmed Khan", "O'Neil").
export const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;
export function nameError(value, label = 'Name') {
  const v = (value || '').trim();
  if (!v) return `${label} is required`;
  if (v.length < 2) return `${label} must be at least 2 letters`;
  if (!NAME_RE.test(v)) return `${label} can contain alphabets only (no numbers or symbols)`;
  return '';
}

// Fills a <ul> with the password rules and ticks them while the user types
export function bindChecklist(listEl, inputEl) {
  const draw = () => {
    listEl.innerHTML = PASSWORD_RULES.map((r) => {
      const ok = r.test(inputEl.value);
      return `<li class="${ok ? 'ok' : ''}">${ok ? '✔' : '○'} ${r.label}</li>`;
    }).join('');
  };
  inputEl.addEventListener('input', draw);
  draw();
}

// Email: must contain @, a domain and an extension (e.g. name@gmail.com)
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

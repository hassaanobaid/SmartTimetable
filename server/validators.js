// Email must look like name@domain.ext (has @, a domain and a dot-extension)
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

function validateEmail(email) {
  if (!email) return 'Email is required';
  if (email.length > 150) return 'Email is too long';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email (example: name@gmail.com)';
  return null;
}

// Returns a list of problems. Empty list = strong password.
function validatePassword(p) {
  const errors = [];
  if (!p || p.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(p || '')) errors.push('At least one capital letter (A-Z)');
  if (!/[a-z]/.test(p || '')) errors.push('At least one small letter (a-z)');
  if (!/[0-9]/.test(p || '')) errors.push('At least one number (0-9)');
  if (!/[^A-Za-z0-9\s]/.test(p || '')) errors.push('At least one special character (! @ # $ % ...)');
  if (/\s/.test(p || '')) errors.push('No spaces allowed');
  return errors;
}

module.exports = { EMAIL_RE, validateEmail, validatePassword };

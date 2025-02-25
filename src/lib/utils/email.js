import * as EmailValidator from 'email-validator';
function validateLocalhostEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Regex for user@localhost:port format
  const localhostEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@localhost:\d{1,5}$/;

  return localhostEmailRegex.test(email);
}

export function validate(email) {
  let email_valid = EmailValidator.validate(email);
  if (!email_valid) {
    email_valid = validateLocalhostEmail(email);
  }
  return email_valid;
}

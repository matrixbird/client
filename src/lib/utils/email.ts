import * as EmailValidator from 'email-validator';
function validateLocalhostEmail(email: string) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Regex for user@localhost:port format
  const localhostEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@localhost:\d{1,5}$/;

  return localhostEmailRegex.test(email);
}

export function validate(email: string): boolean {
  let email_valid = EmailValidator.validate(email);
  if (!email_valid) {
    email_valid = validateLocalhostEmail(email);
  }
  return email_valid;
}

function localhost_replace(original: string, pos: number = 0): string {
  const regex = /^(.+:)(\d)(\d)(\d+)$/;
  return original.replace(regex, (_match, domain, first, _second, rest) => {
    return `${domain}${first}${pos}${rest}`;
  });
}

export function get_email_domain(email: string): string | undefined {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return;
  }

  const [, domain] = email.split('@');

  if(domain.includes('localhost:') && !domain.includes('.')) {
    return localhost_replace(domain);
  }

  return domain;
}

import { PUBLIC_HOMESERVER_NAME } from '$env/static/public';

export function email_to_mxid(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'Invalid email format';
  }
  
  const [username, domain] = email.split('@');
  
  return `@${username}:${domain}`;
}

export function mxid_to_email(matrixId) {
  if (!matrixId) return null;
  const match = matrixId.match(/^@([^:]+):(.+)$/);
  
  if (!match) {
    return null; 
  }
  
  const [, username, domain] = match;
  return `${username}@${domain}`;
}

export function get_localpart(matrixId) {
  if (typeof matrixId !== 'string' || !matrixId.startsWith('@')) {
    return null;
  }
  
  const match = matrixId.match(/@([^:]+):/);
  return match ? match[1] : null;
}

export function get_domain(matrixId) {
  // Check if the input is a string and starts with @
  if (typeof matrixId !== 'string' || !matrixId.startsWith('@')) {
    return null;
  }
  
  // Extract the part after the colon
  const match = matrixId.match(/@[^:]+:(.+)/);
  return match ? match[1] : null;
}

export function is_federated(matrixId) {
  const domain = get_domain(matrixId);
  return domain !== PUBLIC_HOMESERVER_NAME;
}

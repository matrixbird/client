import { PUBLIC_HOMESERVER_NAME } from '$env/static/public';

export function email_to_mxid(email: string) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'Invalid email format';
  }
  
  const [username, domain] = email.split('@');
  
  return `@${username}:${domain}`;
}

export function mxid_to_email(matrixId: string) {
  if (!matrixId) return null;
  const match = matrixId.match(/^@([^:]+):(.+)$/);
  
  if (!match) {
    return null; 
  }
  
  const [, username, domain] = match;
  return `${username}@${domain}`;
}

export function get_localpart(matrixId: string) {
  if (typeof matrixId !== 'string' || !matrixId.startsWith('@')) {
    return null;
  }
  
  const match = matrixId.match(/@([^:]+):/);
  return match ? match[1] : null;
}

export function get_email_localpart(email: string) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return null;
  }
  return email.split('@')[0];
}

export function get_email_domain(email: string) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return null;
  }
  return email.split('@')[1];
}

export function get_domain(matrixId: string) {
  if (typeof matrixId !== 'string' || !matrixId.startsWith('@')) {
    return null;
  }
  
  const match = matrixId.match(/@[^:]+:(.+)/);
  return match ? match[1] : null;
}

export function is_federated(matrixId: string) {
  const domain = get_domain(matrixId);
  return domain !== PUBLIC_HOMESERVER_NAME;
}

export function is_local_room(roomId: string) {
  const id = roomId.substring(1);
  const c = id.indexOf(':');
  if (c === -1) {
    throw new Error('Bad Matrix room ID.');
  }
  
  const domain = id.substring(c + 1);
  return domain === PUBLIC_HOMESERVER_NAME;

}

export function strip_mxc(mxc: string) {
  return mxc.replace('mxc://', '');
}

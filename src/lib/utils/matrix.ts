import { PUBLIC_HOMESERVER_NAME } from '$env/static/public';

export function email_to_mxid(email: string): string | undefined {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return undefined;
  }
  
  const [username, domain] = email.split('@');
  return `@${username}:${domain}`;
}

export function mxid_to_email(matrixId: string): string | undefined {
  if (!matrixId) return;
  const match = matrixId.match(/^@([^:]+):(.+)$/);
  
  if (!match) {
    return; 
  }
  
  const [, username, domain] = match;
  return `${username}@${domain}`;
}

export function get_localpart(matrixId: string): string | undefined {
  if (typeof matrixId !== 'string' || !matrixId.startsWith('@')) {
    return ;
  }
  
  const match = matrixId.match(/@([^:]+):/);
  return match ? match[1] : undefined;
}

export function get_email_localpart(email: string): string | undefined {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return;
  }
  return email.split('@')[0];
}

export function get_email_domain(email: string): string | undefined {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return;
  }
  return email.split('@')[1];
}

export function get_domain(matrixId: string): string | undefined {
  if (typeof matrixId !== 'string' || !matrixId.startsWith('@')) {
    return;
  }
  
  const match = matrixId.match(/@[^:]+:(.+)/);
  return match ? match[1] : undefined;
}

export function is_federated(matrixId: string): boolean {
  const domain = get_domain(matrixId);
  return domain !== PUBLIC_HOMESERVER_NAME;
}

export function is_local_room(roomId: string): boolean {
  const id = roomId.substring(1);
  const c = id.indexOf(':');
  if (c === -1) {
    throw new Error('Bad Matrix room ID.');
  }
  
  const domain = id.substring(c + 1);
  return domain === PUBLIC_HOMESERVER_NAME;

}

export function strip_mxc(mxc: string): string {
  return mxc.replace('mxc://', '');
}

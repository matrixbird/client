import { PUBLIC_HOMESERVER_BASE_URL } from '$env/static/public';
import { json } from '@sveltejs/kit';

export function GET() {
  const data = {
    'm.homeserver': {
      'base_url': PUBLIC_HOMESERVER_BASE_URL
    },
  }
  return json(data);
}


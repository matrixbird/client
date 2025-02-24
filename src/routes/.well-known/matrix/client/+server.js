import { PUBLIC_HOMESERVER_BASE_URL } from '$env/static/public';
import { json } from '@sveltejs/kit';

export function GET() {
  const data = {
    'm.homeserver': {
      'base_url': "https://matrix.matrixbird.com",
    },
    "org.matrix.msc3575.proxy": {
      "url": "https://matrix.matrixbird.com"
    }
  }

  return json(data);
}


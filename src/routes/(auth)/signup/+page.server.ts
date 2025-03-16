import { PUBLIC_APPSERVICE } from '$env/static/public';

import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ fetch, url }) => {

  const endpoint = `${PUBLIC_APPSERVICE}/health`;
  const res = await fetch(endpoint);
  const data = await res.json();

  const code = url.searchParams.get('code')
  if(code) {
    const endpoint = `${PUBLIC_APPSERVICE}/auth/code/validate/${code}`;
    const res = await fetch(endpoint);
    const json = await res.json();
    if(json?.valid) {
      json.code = code;
      data.invite_code = json;
    }
  }

	return data;

}

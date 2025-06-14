import { redirect } from "@sveltejs/kit";
//import { PUBLIC_MATRIXBIRD_SERVER } from '$env/static/public';

/*
import type { Actions } from './$types';

export const actions = {
  default: async ({ cookies }) => {

    const { MATRIXBIRD_SERVER } = await parent();

    let session_id = cookies.get("session_id");
    cookies.delete('session_id', { path: '/' });
    cookies.delete('access_token', { path: '/' });
    cookies.delete('device_id', { path: '/' });
    cookies.delete('user_id', { path: '/' });

    try {
      let url = `${PUBLIC_MATRIXBIRD_SERVER}/auth/session/revoke`;
      fetch(url, {
        headers: { 'Authorization': `Bearer ${session_id}` }
      });
    } catch(_) {
    }

    redirect(303, '/login');
  }
} satisfies Actions;
*/

import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ parent, cookies, fetch }) => {

    const { MATRIXBIRD_SERVER } = await parent();

    let session_id = cookies.get("session_id");
    cookies.delete('session_id', { path: '/' });
    cookies.delete('access_token', { path: '/' });
    cookies.delete('device_id', { path: '/' });
    cookies.delete('user_id', { path: '/' });

    try {
      let url = `${MATRIXBIRD_SERVER}/auth/session/revoke`;
      fetch(url, {
        headers: { 'Authorization': `Bearer ${session_id}` }
      });
    } catch(_) {
    }


    redirect(303, '/login');
}

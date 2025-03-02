import { redirect } from "@sveltejs/kit";
import { PUBLIC_APPSERVICE } from '$env/static/public';

export const actions = {
  default: async ({ cookies }) => {
    let session_id = cookies.get("session_id");
    cookies.delete('session_id', { path: '/' });

    try {
      let url = `${PUBLIC_APPSERVICE}/auth/session/revoke`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session_id}` }
      });

      const data = await response.json();
      console.log(data)
    } catch(_) {
    }

    redirect(303, '/login');
  }
};

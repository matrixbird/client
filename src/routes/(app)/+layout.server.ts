//import { PUBLIC_MATRIXBIRD_SERVER } from '$env/static/public';
import { redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
    let session_id = cookies.get("session_id");
    let access_token = cookies.get("access_token");
    let device_id = cookies.get("device_id");
    let home_server = cookies.get("home_server");
    let server_name = cookies.get("server_name");
    let user_id = cookies.get("user_id");

    console.log("session_id", session_id);
    console.log("access_token", access_token);
    console.log("device_id", device_id);
    console.log("home_server", home_server);
    console.log("server_name", server_name);
    console.log("user_id", user_id);

    if(!session_id || !access_token || !device_id || !user_id) {
        redirect(303, '/login');
    }

    let data: {
        session_id: string | undefined;
        access_token: string | undefined;
        device_id: string | undefined;
        home_server: string | undefined;
        server_name: string | undefined;
        user_id: string | undefined;
    } = {
            session_id,
            access_token,
            device_id,
            home_server,
            server_name,
            user_id
        }

    /*
  let reject = false;

  try {
    let url = `${PUBLIC_MATRIXBIRD_SERVER}/auth/session/validate`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${session_id}` }
    });

    const data = await response.json();

    console.log(data)

    if (data?.valid && data?.access_token && data?.user_id && data?.device_id) {
      data.access_token = data.access_token;
      data.user_id = data.user_id;
      data.device_id = data.device_id;
    } else if(data?.valid == false) {
      console.log("removing cookies and redirecting to /login")
      cookies.delete('session_id', { path: '/' });
      //cookies.delete('device_id', { path: '/' });
      reject = true;
    }

  } catch (err) {
    // Handle connection errors
    error(502, { message: "Couldn't reach homeserver." });
  } finally {
  }

  if(reject) {
    redirect(303, '/login');
  }
  */

    return data;
}

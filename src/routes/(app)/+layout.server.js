import { PUBLIC_APPSERVICE } from '$env/static/public';
import { error, redirect } from "@sveltejs/kit";

/** @type {import('./$types').LayoutServerLoad} */
export async function load( { cookies, fetch } ) {

  let session_id = cookies.get("session_id");
  let device_id = cookies.get("device_id");

  console.log("session_id", session_id);
  console.log("device_id", device_id);

  if(!session_id || !device_id) {
    redirect(303, '/login');
  }

  let locals = {}

  let reject = false;

  try {
    let url = `${PUBLIC_APPSERVICE}/auth/session/validate/${device_id}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${session_id}` }
    });


    const data = await response.json();

    console.log(data)

    if (data?.valid && data?.access_token && data?.user_id) {
      locals.access_token = data.access_token;
      locals.user_id = data.user_id;
      locals.device_id = device_id;
    } else if(data?.valid == false) {
      console.log("removing cookies and redirecting to /login")
      console.log("removing cookies and redirecting to /login")
      console.log("removing cookies and redirecting to /login")
      cookies.delete('session_id', { path: '/' });
      cookies.delete('device_id', { path: '/' });
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

  return locals;
}

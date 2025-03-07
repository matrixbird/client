import { PUBLIC_APPSERVICE } from '$env/static/public';
import { error, redirect } from "@sveltejs/kit";

/** @type {import('./$types').LayoutServerLoad} */
export async function load( { cookies, fetch } ) {

  let session_id = cookies.get("session_id");
  let access_token = cookies.get("access_token");
  let device_id = cookies.get("device_id");
  let user_id = cookies.get("user_id");

  console.log("session_id", session_id);
  console.log("access_token", access_token);
  console.log("device_id", device_id);
  console.log("user_id", user_id);

  let data = {
    session_id,
    access_token,
    device_id,
    user_id
  }

  return data;
}

import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').LayoutServerLoad} */
export function load( { locals, cookies } ) {
  /*
  let session_id = cookies.get("session_id");
  let device_id = cookies.get("device_id");

  if(session_id && device_id) {
    redirect(303, '/mail/inbox');
  }
  */

  return locals;
}

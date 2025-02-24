import { PUBLIC_APPSERVICE } from '$env/static/public';
import { error, redirect } from "@sveltejs/kit";

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {

  let session_id = event.cookies.get("session_id");
  let device_id = event.cookies.get("device_id");

  if(event.route.id === null) {

    if(!session_id || !device_id) {
      redirect(303, `/login`);
    }

    redirect(303, `/mail/inbox`);
  }

  const response = await resolve(event);

  return response;
};

import { PUBLIC_HOMESERVER } from '$env/static/public';
import { error, redirect } from "@sveltejs/kit";

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {

  let session_id = event.cookies.get("session_id");
  let access_token = event.cookies.get("access_token");
  let device_id = event.cookies.get("device_id");
  let user_id = event.cookies.get("user_id");

  console.log(event.route)
  if(event.route.id === null) {

    if(!session_id || !access_token || !device_id || !user_id) {
      redirect(303, `/login`);
    }

    redirect(303, `/mail/inbox`);
  }

  const response = await resolve(event);

  return response;
};


/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ request, fetch, event: { cookies } }) {
  let access_token = cookies.get("access_token");
  if (access_token && request.url.startsWith(PUBLIC_HOMESERVER)) {
    request.headers.set('Authorization', `Bearer ${access_token}`);
  }
  return fetch(request);
}

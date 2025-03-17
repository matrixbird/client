import { redirect } from "@sveltejs/kit";

import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ( { locals, cookies } ) => {
  let access_token = cookies.get("access_token");

  if(access_token) {
    redirect(303, '/mail/inbox');
  }
  return locals;
}

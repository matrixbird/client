import { 
  PUBLIC_APPSERVICE,
  PUBLIC_HOMESERVER,
  PUBLIC_HOMESERVER_NAME,
} from '$env/static/public';

import { browser } from '$app/environment';
//import { getCookie, createCookie } from '$lib/utils/cookie'

let homeserver = $state(PUBLIC_HOMESERVER);
let homeserver_name = $state(PUBLIC_HOMESERVER_NAME);
let appservice = $state(PUBLIC_APPSERVICE);

let featured = $state(null);


let ready = $state(false);

export function createAppStore() {

  function isReady() {
    ready = true
  }

  return {

    get homeserver() {
      return homeserver;
    },

    get appservice() {
      return appservice;
    },

    get ready() {
      return ready;
    },

    isReady,
    };
}

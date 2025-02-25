import { createUIStore } from './ui.svelte.js';

import { 
  PUBLIC_HOMESERVER,
} from '$env/static/public';

let session = $state(null);


export function createStore() {

  function updateSession(data) {
    session = data
  }

  return {

    get session() {
      return session;
    },

    get ui() {
      return createUIStore();
    },

    updateSession,
  };
}

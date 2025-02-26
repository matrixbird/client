import { createUIStore } from './ui.svelte.js';
import { browser } from '$app/environment';

import { 
  PUBLIC_HOMESERVER,
} from '$env/static/public';

let session = $state(null);


export const userState = $state({
  new_user: true
});

export const ui_state = $state({
  expanded: false
});

function getFromLS() {
    if(localStorage.getItem('expanded')) {
        return true
    }
    return false
}

if(browser) {
    ui_state.expanded = getFromLS()
}

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

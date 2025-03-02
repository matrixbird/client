import { createUIStore } from './ui.svelte.js';
import { browser } from '$app/environment';

import { 
  PUBLIC_HOMESERVER,
} from '$env/static/public';

let session = $state(null);

export const app = $state({
    ready: false
});

export const dev_mode = $state({
    enabled: false
});

export const userState = $state({
    new_user: false
});

export const ui_state = $state({
    expanded: false,
    drag_offset: null,
});

export const route_state = $state({
    mail: null,
});

export const email_context_menu = $state({
    email: null,
    pos: null,
    element: null,
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

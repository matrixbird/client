import { createUIStore } from './ui.svelte.js';
import { browser } from '$app/environment';

import { 
  PUBLIC_HOMESERVER,
} from '$env/static/public';

let session = $state(null);

export const app = $state({
    started_at: new Date().valueOf(),
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

export const count = $state({
    inbox: null
});


function getFromLS(item) {
    if(localStorage.getItem(item)) {
        return true
    }
    return false
}

if(browser) {
    ui_state.expanded = getFromLS('expanded')
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

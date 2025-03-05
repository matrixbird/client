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
    sidebar_toggled: false,
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
    let items = ['expanded', 'sidebar_toggled']
    items.forEach(item => {
        if(getFromLS(item)) {
            ui_state[item] = true
        }
    })
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

export function sidebar_toggled() {
    return ui_state.sidebar_toggled
}

export function toggleSidebar() {
    ui_state.sidebar_toggled = !ui_state.sidebar_toggled
    if(ui_state.sidebar_toggled) {
        localStorage.setItem('sidebar_toggled', true)
    } else {
        localStorage.removeItem('sidebar_toggled')
    }
  }


import { browser } from '$app/environment';

import { 
  PUBLIC_HOMESERVER,
} from '$env/static/public';

let session = $state(null);

export const app = $state({
    started_at: new Date().valueOf(),
    ready: false,
    status: null,
});

export const dev_mode = $state({
    enabled: false
});

export const userState = $state({
    new_user: false
});

export const ui_state = $state({
    expanded: false,
    sidebar_hidden: false,
    drag_offset: null,
});

export const route_state = $state({});

export const email_context_menu = $state({
    email: null,
    pos: null,
    element: null,
});

export const count = $state({
    inbox: null
});

export const alert = $state({
    active: false,
    title: null,
    message: null,
});

export function newAlert(data) {
    alert.title = data.title
    alert.message = data.message
    alert.active = true
}

export function killAlert() {
    alert.active = false
    alert.title = null
    alert.message = null
}


function getFromLS(item) {
    if(localStorage.getItem(item)) {
        return true
    }
    return false
}

if(browser) {
    let items = ['expanded', 'sidebar_hidden']
    items.forEach(item => {
        if(getFromLS(item)) {
            ui_state[item] = true
        }
    })
}

export function updateAppStatus(status) {
  app.status = status;
}

export function createAppStore() {

  function appIsReady() {
    app.ready = true;
  }


  return {

    get app() {
      return app;
    },


    appIsReady,
    updateAppStatus
  };
}

export function sidebar_hidden() {
    return ui_state.sidebar_hidden
}

export function toggleSidebar() {
    ui_state.sidebar_hidden = !ui_state.sidebar_hidden
    if(ui_state.sidebar_hidden) {
        localStorage.setItem('sidebar_hidden', true)
    } else {
        localStorage.removeItem('sidebar_hidden')
    }
  }


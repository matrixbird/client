import { browser } from '$app/environment';

import { session } from '$lib/store/session.svelte'

import { updateClientUISettings } from './matrix.svelte'

import type { UIState, ClientUISettings } from '$lib/types/matrixbird'

interface App {
    started_at: number,
    ready: boolean,
    status: string | null,
    features: object | null,
}

export const app: App = $state({
    started_at: new Date().valueOf(),
    ready: false,
    status: null,
    features: null,
});

export function setFeatures(features: object) {
    app.features = features
    console.log("Features updated:", $state.snapshot(app.features))
}

export const dev_mode = $state({
    enabled: false
});

export const userState = $state({
    new_user: false
});

export const ui_state: UIState = $state({
    expanded: false,
    sidebar_hidden: false,
});

let mobile = $state(false);

export function is_mobile() {
    return mobile
}

if(browser) {
    isMobile()
}

function isMobile() {

    if(navigator.userAgentData.mobile) {
        mobile = true
        return
    }

    const userAgent = navigator.userAgent 
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

    const isSmallScreen = window.innerWidth <= 768;

    const hasTouchScreen = (
        ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) 
    );

    mobile = mobileRegex.test(userAgent) || (isSmallScreen && hasTouchScreen);
}

$effect.root(() => {
    $effect(() => {
        //console.log("Mobile:", mobile)
    })
})


export const route_state = $state({});

export const email_context_menu = $state({
    email: null,
    pos: null,
    element: null,
});

export const count = $state({
    inbox: null
});


export interface Alert {
    title?: string | null,
    message: string | null,
    active?: boolean,
}

export const alert: Alert = $state({
    title: null,
    message: null,
    active: false,
});

export function newAlert(data: Alert) {
    alert.title = data.title
    alert.message = data.message
    alert.active = true
}

export function killAlert() {
    alert.active = false
    alert.title = null
    alert.message = null
}


function getFromLS(item: string) {
    if(localStorage.getItem(item)) {
        return true
    }
    return false
}

if(browser) {
    let items: Array<keyof UIState> = ['expanded', 'sidebar_hidden'];
    items.forEach(item => {
        if(getFromLS(item)) {
            ui_state[item] = true
        }
    })

}

export function updateAppStatus(status: string) {
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

export async function toggleExpand() {
    ui_state.expanded = !ui_state.expanded
    if(!ui_state.expanded) {
        localStorage.removeItem('expanded')
    } else {
        localStorage.setItem('expanded', 'true')
    }
    if(session) {
        let data: ClientUISettings =  {
            expanded: ui_state.expanded,
            sidebar_hidden: ui_state.sidebar_hidden
        }
        await updateClientUISettings(data)
    }
}


export async function toggleSidebar() {
    ui_state.sidebar_hidden = !ui_state.sidebar_hidden
    if(ui_state.sidebar_hidden) {
        localStorage.setItem('sidebar_hidden', "true")
    } else {
        localStorage.removeItem('sidebar_hidden')
    }
    if(session) {
        let data: ClientUISettings =  {
            expanded: ui_state.expanded,
            sidebar_hidden: ui_state.sidebar_hidden
        }
        await updateClientUISettings(data)
    }
}


<script>
import { PUBLIC_HOMESERVER } from '$env/static/public';
import { onMount } from 'svelte';
import {
	goto,
} from '$app/navigation';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import '../../app.css';
import logo from '../../logo.png'
import Header from '$lib/header/header.svelte'
import Switcher from '$lib/switcher/switcher.svelte'
import Editor from '$lib/editor/editor.svelte'
import EmailContextMenu from '$lib/components/email/context-menu.svelte'

import ThemeToggle from '$lib/theme/toggle.svelte'

import Profile from '$lib/profile/profile.svelte'

import { expand, collapse } from '$lib/assets/icons.js'

import { userState, ui_state } from '$lib/store/store.svelte.js'
import { createStore, dev_mode } from '$lib/store/store.svelte.js'
const store = createStore()

import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const matrixStore = createMatrixStore()

const session = $derived(matrixStore?.session)

let { data, children } = $props();

let ready = $derived(matrixStore?.ready)

$effect(() => {
    if(data?.access_token && data?.device_id && data?.user_id) {
        matrixStore.updateSession(data)
    }
    if(browser && session) {
        matrixStore.createMatrixClient()
    }
})

onMount(() => {
    if($page.url.hostname == "localhost") {
        dev_mode.enabled = true
    }
})

let is_dev_mode = $derived(dev_mode?.enabled);


const events = $derived(matrixStore?.events)
const first_event = $derived.by(() => {
    return events?.values().next().value
})
let new_user = $derived(userState?.new_user)

$effect(() => {
    if(new_user){
    }
    if(new_user && first_event) {
        userState.new_user = false
        goto(`/mail/inbox/${first_event.event_id}`)
    }
})



let expanded = $derived(ui_state?.expanded)

function expandWindow() {
    if(expanded) {
        ui_state.expanded = false
    } else {
        ui_state.expanded = true
    }

    if(expanded) {
        localStorage.setItem('expanded', 'true')
    } else {
        localStorage.removeItem('expanded')
    }
}

</script>


{#if !ready}
    <div class="loading grid h-screen w-screen overflow-hidden">
        <div class="flex flex-col justify-self-center self-center">
            <div class="spinner"></div>
        </div>
    </div>
{/if}

<Editor />
<EmailContextMenu />

{#if is_dev_mode}
<ThemeToggle />
{/if}

{#if new_user}
{/if}

{#if !expanded && ready}
    <div class="profile">
        <Profile />
    </div>
{/if}


<div class="grid h-screen w-screen overflow-hidden">
    <div class="grid grid-rows-[auto_1fr_auto] overflow-hidden bg-white
            sm:max-w-[1400px] mx-10 justify-self-center self-center 
            w-full h-full max-h-full select-none
            lg:h-8/10 lg:max-h-[800px]"
    class:boxed={!expanded}
    class:expanded={expanded}>

        <Header />


        <div class="overflow-hidden 
            grid grid-cols-[auto_1fr]"
            class:grid-cols-[3rem_1fr]={expanded}
            class:boxed-content={!expanded}>

            <Switcher />


            <div class="page overflow-hidden">
                {@render children()}
            </div>

        </div>


    </div>

</div>


<style>
.loading {
    background: var(--background);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
}
.expanded {
    height: 100vh;
    width: 100vw;
    max-height: 100vh;
    max-width: 100vw;
    margin: 0;
}
.profile {
    position: fixed;
    z-index: 1000;
    top: 1rem;
    right: 1rem;
}
</style>

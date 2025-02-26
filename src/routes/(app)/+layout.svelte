<script>
import { PUBLIC_HOMESERVER } from '$env/static/public';
import { onMount } from 'svelte';
import {
	goto,
} from '$app/navigation';
import { browser } from '$app/environment';
import '../../app.css';
import logo from '../../logo.png'
import Switcher from '$lib/switcher/switcher.svelte'
import Editor from '$lib/editor/editor.svelte'

import Logout from '$lib/auth/logout.svelte'
import ThemeToggle from '$lib/theme/toggle.svelte'

import Profile from '$lib/profile/profile.svelte'

import { expand, collapse } from '$lib/assets/icons.js'

import { userState, ui_state } from '$lib/store/store.svelte.js'
import { createStore } from '$lib/store/store.svelte.js'
const store = createStore()

import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const matrixStore = createMatrixStore()

const session = $derived(matrixStore?.session)

let { data, children } = $props();

let ready = $derived(matrixStore?.ready)

$effect(() => {
    console.log(data)
    if(data?.access_token && data?.device_id && data?.user_id) {
        matrixStore.updateSession(data)
    }
    if(browser && session) {
        matrixStore.createMatrixClient()
    }
})



const events = $derived(matrixStore?.events)
const first_event = $derived.by(() => {
    if(events) {
        return events[0]
    }
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

{#if new_user}
{/if}

{#if !expanded}
    <div class="profile">
        <Profile />
    </div>
{/if}

<div class="grid h-screen w-screen overflow-hidden">
    <div class="grid grid-rows-[auto_1fr] overflow-hidden bg-white
            sm:max-w-[1600px] mx-10 justify-self-center self-center 
            w-full h-full max-h-full select-none
            lg:h-8/10 lg:max-h-[960px]"
    class:box={!expanded}
    class:expanded={expanded}>

        <div class="flex bg-neutral-900 p-2 text-white font-medium">

            <div class="flex place-items-center silk cursor-pointer text ml-1 tracking-wide
">
                matrixbird
            </div>

            <div class="flex-1 flex place-items-center ml-3">
            </div>
            <div class="cursor-pointer flex place-items-center mr-1"
            onclick={expandWindow}>
                {#if expanded}
                    {@html collapse}
                {:else}
                    {@html expand}
                {/if}
            </div>
        </div>


        <div class="overflow-hidden 
            grid grid-cols-[3rem_1fr] ">

            <Switcher />


            <div class="page overflow-hidden">
                {@render children()}
            </div>

        </div>

    </div>

</div>




<Logout />

<ThemeToggle />

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
    top: 2rem;
    left: 2rem;
}
</style>

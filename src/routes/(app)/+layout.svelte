<script>
import { PUBLIC_HOMESERVER } from '$env/static/public';
import { draggable } from '@neodrag/svelte';
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

let _expanded = $state(false);

$effect(() => {
    if(new_user){
    }
    if(new_user && first_event) {
        userState.new_user = false
        goto(`/mail/inbox/${first_event.event_id}`)
    }

    if(expanded) {
        _expanded = true
        mb.style.translate = '0'
        mb.style.transform = 'none'
        setTimeout(() => {
            mb.style.removeProperty('transform')
            mb.style.removeProperty('translate')
        },500)
    }
    
    if(_expanded && !expanded && ui_state?.drag_offset != null) {
        mb.style.transform = `translate3d(${ui_state.drag_offset[0]}px,
${ui_state.drag_offset[1]}px, 0px)`
        _expanded = false
    }
})


let mb;

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

let dragging = $state(false);

let dragopts = $derived.by(() => {
    return {
        handle: '.header',
        disabled: expanded,
        onDrag: ({ offsetX, offsetY, rootNode, currentNode, event }) => {
        },
        onDragStart: ({ offsetX, offsetY, rootNode, currentNode, event }) => {
            dragging = true
        },
        onDragEnd: ({ offsetX, offsetY, rootNode, currentNode, event }) => {
            dragging = false
            setTimeout(() => {
                ui_state.drag_offset = [offsetX, offsetY]
            }, 3000)
        },
    }
})


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


<div class="grid h-screen w-screen overflow-hidden" >

    <div class="mb grid grid-rows-[auto_1fr_auto] overflow-hidden bg-white
            sm:max-w-[1400px] mx-10 justify-self-center self-center 
            w-full h-full max-h-full select-none
            lg:h-8/10 lg:max-h-[800px]"
        class:boxed={!expanded}
        class:expanded={expanded} 
        use:draggable={dragopts}
        bind:this={mb}>

        <div class="header">
            <Header {dragging} />
        </div>


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
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    translate: 0;
}
.profile {
    position: fixed;
    z-index: 1000;
    top: 1rem;
    right: 1rem;
}
</style>

<script>
import { PUBLIC_HOMESERVER } from '$env/static/public';
import { draggable } from '@neodrag/svelte';
import { 
    mxid_to_email,
} from '$lib/utils/matrix.js'
import { onMount } from 'svelte';
import {
	goto,
} from '$app/navigation';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import '../../app.css';

import Listeners from '$lib/app/listeners.svelte'
import Header from '$lib/header/header.svelte'
import Switcher from '$lib/switcher/switcher.svelte'
import Editor from '$lib/editor/editor.svelte'
import EmailContextMenu from '$lib/components/email/context-menu.svelte'

import ThemeToggle from '$lib/theme/toggle.svelte'

import Navbar from '$lib/navbar/navbar.svelte';



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
    if(expanded) {
        localStorage.removeItem('window')
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
    
    if(_expanded && !expanded && browser) {
        let offset = localStorage.getItem('window')
        if(offset) {
            let [x, y] = JSON.parse(offset)
            mb.style.transform = `translate3d(${x}px,${y}px, 0px)`
        }
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

let defaultPosition = $derived.by(() => {
    if(browser && !_expanded && !expanded) {
        console.log("here")
        let offset = localStorage.getItem('window')
        if(offset) {
            let [x, y] = JSON.parse(offset)
            return { x, y }
        }
    }
})

let dragopts = $derived.by(() => {
    return {
        handle: '.header',
        disabled: expanded,
        position: defaultPosition,
        bounds: 'body',
        onDrag: ({ offsetX, offsetY, rootNode, currentNode, event }) => {
            dragging = true
        },
        onDragStart: ({ offsetX, offsetY, rootNode, currentNode, event }) => {
            dragging = true
        },
        onDragEnd: ({ offsetX, offsetY, rootNode, currentNode, event }) => {
            dragging = false
            setTimeout(() => {
                ui_state.drag_offset = [offsetX, offsetY]
                localStorage.setItem('window', JSON.stringify([offsetX, offsetY]))
            }, 10)
        },
    }
})


function dragStart(e) {
    dragging = true
}

function dragEnd(e) {
    dragging = false
}

let mailbox = $derived.by(() => {
    return $page.params.mailbox
})

let title = $derived.by(() => {
    if(mailbox == "inbox") {
        return "Inbox"
    } else if(mailbox == "sent") {
        return "Sent Mail"
    } else if(mailbox == "drafts") {
        return "Drafts"
    }
})

let email = $derived.by(() => {
    return mxid_to_email(data.user_id)
})



let width = $state(900);
let height = $state(600);

</script>

<svelte:head>
    <title>{title} - {email}</title>
</svelte:head>

{#if !ready}
    <div class="loading grid h-screen w-screen overflow-hidden">
        <div class="flex flex-col justify-self-center self-center">
            <div class="spinner"></div>
        </div>
    </div>
{/if}

<Listeners />
<Editor />
<EmailContextMenu />

{#if is_dev_mode}
<ThemeToggle />
{/if}

{#if new_user}
{/if}

{#if !expanded && ready}
    <Navbar />
{/if}


<div class="grid h-screen w-screen overflow-hidden" >

    <div class="mb grid grid-rows-[auto_1fr_auto] overflow-hidden bg-white
            mx-10 justify-self-center self-center 
            w-full h-full max-h-full select-none relative
            "
        style="--width:{width}px; --height:{height}px;"
        class:drag-shadow={dragging}
        class:boxed={!expanded}
        class:expanded={expanded} 
        use:draggable={dragopts}
        bind:this={mb}>

        <div class="header">
            <Header {dragging} {dragStart} {dragEnd} />
        </div>


        <div class="overflow-hidden 
            grid"
            class:grid-cols-[3rem_1fr]={expanded}
            class:boxed-content={!expanded}>

            {#if expanded}
                <Switcher />
            {/if}


            <div class="page overflow-hidden">
                {@render children()}
            </div>

        </div>

        <div class="absolute bottom-0 right-0 h-5 w-5 border-r-2 border-b-2
            border-bird-400 cursor-nwse-resize">
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
.mb{
    transition: box-shadow 0.1s;
    max-width: var(--width);
    max-height: var(--height);
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

.drag-shadow {
    outline: 4px solid theme('colors.bird.600');
}
</style>

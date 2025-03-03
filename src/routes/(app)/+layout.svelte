<script>
import { PUBLIC_HOMESERVER } from '$env/static/public';
import { draggable } from '@neodrag/svelte';
import { 
    mxid_to_email,
} from '$lib/utils/matrix.js'
import { onMount, onDestroy } from 'svelte';
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
import Ghost from '$lib/components/ghost/ghost.svelte';


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
    if(browser) {
        window.addEventListener('resize', handleResize);
    }
})

onDestroy(() => {
    if(browser) {
        window.removeEventListener('resize', handleResize);
    }
})

function handleResize(e) {
    //position = calcPosition()
    //localStorage.setItem('window_position', JSON.stringify([position.x,position.y]))
}

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

    //calculate when collapsed from expanded position
    if(_expanded && !expanded && browser) {
        let offset = localStorage.getItem('window_position')
        if(offset) {
            let [x, y] = JSON.parse(offset)
            mb.style.translate = `${x}px, ${y}px`
        }
        _expanded = false
    }

    // calculate on startup
    if(browser && position.x == 0 && position.y == 0) {
        let offset = localStorage.getItem('window_position')
        if(offset) {
            let [x, y] = JSON.parse(offset)
            position = { x, y }
            final_position = { x, y }
            console.log("set init pos from localstorage", position)
        } else {
            position = calcPosition()
            final_position = calcPosition()
        }
    }

    //set initial window size from localstorage
    if(!resizing) {
        let size = localStorage.getItem('window_size')
        if(size) {
            let [w, h] = JSON.parse(size)
            width = w
            height = h
        }
    }

})


function calcPosition() {
    if (!browser && !mb) return;

    const width = mb.offsetWidth;
    const height = mb.offsetHeight;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const left = (vw - width) / 2;
    const top = (vh - height) / 2;

    return { x: left, y: top }
}


let mb;

let expanded = $derived(ui_state?.expanded)

let dragging = $state(false);

let position = $state({
    x: 0,
    y: 0
})

let final_position = $state({
    x: 0,
    y: 0
})

let resizing = $state(false);

let dragopts = $derived.by(() => {
    return {
        handle: '.header',
        disabled: expanded || resizing,
        legacyTranslate: false, 
        gpuAcceleration: true,
        position: position,
        //bounds: 'body',
        transform: ({ offsetX, offsetY, node }) => {
            if(!node) return
            //node.style.translate = `${offsetX + 50}px ${offsetY + 20}px`;
            //node.style.translate = `${offsetX + 50}px ${offsetY + 20}px`;
        },
        onDrag: ({ offsetX, offsetY, rootNode, currentNode, event }) => {
            dragging = true
            position = { x: offsetX, y: offsetY }
        },
        onDragStart: ({ offsetX, offsetY, rootNode, currentNode, event }) => {
            dragging = true
        },
        onDragEnd: ({ offsetX, offsetY, rootNode, currentNode, event }) => {
            dragging = false
            final_position = { x: offsetX, y: offsetY }
            setTimeout(() => {
                ui_state.drag_offset = [offsetX, offsetY]
                localStorage.setItem('window_position', JSON.stringify([offsetX, offsetY]))
            }, 10)
        },
    }
})

let ghostPosition = $state(null);

function buildGhostWindow() {
    let ghost = document.createElement('div')
    let rect = mb.getBoundingClientRect()
    let w = rect.width
    let h = rect.height
    let top = rect.top
    let left = rect.left
    console.log("size", w, h)
    console.log("pos", top, left)

    ghostPosition = {
        width: w,
        height: h,
        top: top,
        left: left,
    }

    /*
    ghost.style.width = `${w}px`
    ghost.style.height = `${h}px`
    ghost.style.position = 'absolute'
    ghost.style.top = `${top}px`
    ghost.style.left = `${left}px`
    ghost.style.zIndex = 1000
    ghost.style.border = '2px solid red'
    ghost.style.opacity = 0.5
    ghost.style.pointerEvents = 'none'
    document.body.appendChild(ghost)
    */
}

$effect(() => {
    if(dragging) {
        buildGhostWindow()
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


function startResize(e) {
    resizing = true


    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', stopResize)
}

function stopResize(e) {
    resizing = false
    document.removeEventListener('mousemove', resize)
    document.removeEventListener('mouseup', stopResize)
    console.log("final dimentions are", width, height)
    localStorage.setItem('window_size', JSON.stringify([width, height]))
}

function resize(e) {
    if(resizing) {
        width += e.movementX
        height += e.movementY
    }
}

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

{#if new_user}
{/if}

{#if !expanded && ready}
    <Navbar />
{/if}


<div class="grid h-screen w-screen overflow-hidden select-none relative" >

    <div class="mb grid grid-rows-[auto_1fr_auto] overflow-hidden bg-background
        select-none absolute
        "
        style="--width:{width}px;--height:{height}px;--offsetX:{final_position?.x}px;--offsetY:{final_position?.y}px;"
        class:drag-shadow={dragging}
        class:pointer-events-none={dragging}
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
            hover:border-bird-600
            border-bird-400 cursor-nwse-resize"
            onmousedown={startResize}
            onmouseup={stopResize}>
        </div>

    </div>

{#if is_dev_mode}
    <ThemeToggle />
{/if}

</div>

{#if dragging}
    <Ghost init={ghostPosition} {position} />
{/if}


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
    z-index: 2;
    width: var(--width);
    height: var(--height);
    top: var(--offsetY);
    left: var(--offsetX);
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
    outline: 2px solid theme('colors.bird.700');
}
</style>

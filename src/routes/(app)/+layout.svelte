<script>
import '../../app.css';
import { PUBLIC_HOMESERVER } from '$env/static/public';
import { onMount, onDestroy } from 'svelte';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import { draggable } from '@neodrag/svelte';
import { mxid_to_email } from '$lib/utils/matrix.js'

import logo from '$lib/logo/logo.js'

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

let { 
    data, 
    children 
} = $props();

let ready = $derived(matrixStore?.ready)

let created = $state(false);

$effect(() => {
})

onMount(() => {
    if(data?.access_token && data?.device_id && data?.user_id) {
        matrixStore.createMatrixClient(data)
    }

    if($page.url.hostname == "localhost") {
        dev_mode.enabled = true
    }
    if(browser) {
        window.addEventListener('resize', handleResize);
        setTimeout(() => {
            storeWindow()
        }, 1000)
    }
})

function storeWindow() {
    let pos = localStorage.getItem('window_position')
    if(!pos) {
        localStorage.setItem('window_position', JSON.stringify([position.x,position.y]))
    }
    let size = localStorage.getItem('window_size')
    if(!size) {
        localStorage.setItem('window_size', JSON.stringify([width, height]))
    }
}

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

let _compact = $state(false);

let _expanded = $state(false);

$effect(() => {
    if(!_compact && compact && browser) {
        if(width < 1280 ) {
            width = 1280
        }
        if(height < 760) {
            height = 760
        }
        //position = calcPosition()
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const left = (vw - width) / 2;
        const top = (vh - height) / 2;
        position = { x: left, y: top }
        //localStorage.setItem('window_position', JSON.stringify([left, top]))
        //localStorage.setItem('window_size', JSON.stringify([width, height]))

        _compact = true
    }

    if(new_user && first_event) {
        //userState.new_user = false
        //goto(`/mail/inbox/${first_event.event_id}`)
    }


    if(browser && expanded) {
        _expanded = true
    }

    //calculate when collapsed from expanded position
    if(_expanded && !expanded && browser) {
        let offset = localStorage.getItem('window_position')
        if(offset) {
            let [x, y] = JSON.parse(offset)
            position = { x, y }
        }
        let size = localStorage.getItem('window_size')
        if(size) {
            let [w, h] = JSON.parse(size)
            width = w
            height = h
        }
        _expanded = false
        _compact = false
    }
    if(_compact && !compact && browser) {
        let offset = localStorage.getItem('window_position')
        if(offset) {
            let [x, y] = JSON.parse(offset)
            position = { x, y }
        }
        let size = localStorage.getItem('window_size')
        if(size) {
            let [w, h] = JSON.parse(size)
            width = w
            height = h
        }
        _expanded = false
        _compact = false
    }

    // calculate on startup
    if(browser && position.x == 0 && position.y == 0) {
        let offset = localStorage.getItem('window_position')
        if(offset) {
            let [x, y] = JSON.parse(offset)
            position = { x, y }
        } else {
            position = calcPosition()
        }
    }

    //set initial window size from localstorage
    if(!resizing && !_compact) {
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
let compact = $derived(ui_state?.compact)

let dragging = $state(false);

let position = $state({
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
            setTimeout(() => {
                ui_state.drag_offset = [offsetX, offsetY]
                localStorage.setItem('window_position', JSON.stringify([offsetX, offsetY]))
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


let width = $state(700);
let height = $state(500);


function startResize(e) {
    resizing = true


    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', stopResize)
}

function stopResize(e) {
    resizing = false
    document.removeEventListener('mousemove', resize)
    document.removeEventListener('mouseup', stopResize)
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
        <div class="logo animate-pulse animate-ping duration-[0.1s] flex flex-col h-10 w-10 justify-self-center self-center">
            {@html logo}
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
    <Switcher />
{/if}


<div class="grid h-screen w-screen overflow-hidden select-none relative" >

    <div class="mb grid grid-rows-[auto_1fr_auto] overflow-hidden bg-background
        select-none absolute
        "
        style="--width:{width}px; --height:{height}px;--offsetX:{position?.x}px;--offsetY:{position?.y}px;"
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


<style>
.loading {
    background: var(--bg);
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

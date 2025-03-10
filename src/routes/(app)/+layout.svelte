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
import Alert from '$lib/components/alert/alert.svelte'

import { userState, ui_state } from '$lib/store/app.svelte.js'
import { createAppStore, dev_mode } from '$lib/store/app.svelte.js'
const store = createAppStore()

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
    calcSize()
    position = calcPosition()
    localStorage.setItem('window_position', JSON.stringify([position.x,position.y]))
}

let is_dev_mode = $derived(dev_mode?.enabled);


const events = $derived(matrixStore?.events)
const first_event = $derived.by(() => {
    return events?.values().next().value
})

let new_user = $derived(userState?.new_user)

let _expanded = $state(false);

let width = $state(1280);
let height = $state(800);

$effect(() => {

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
        if(!resizing) {
            let size = localStorage.getItem('window_size')
            if(size) {
                let [w, h] = JSON.parse(size)
                width = w
                height = h
            }
        }
    }

    //set initial window size from localstorage

})

function calcSize() {
    if (!browser && !mb) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if(width > vw) {
        width = vw - 100
    }
    if(height > vh) {
        height = vh - 100
    }
}

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

let frame = null;
let _position = $state({
    x: 0,
    y: 0
})

let position = $state({
    x: 0,
    y: 0
})

let resizing = $state(false);

let dragopts = $derived.by(() => {
    return {
        handle: '.window-header',
        disabled: expanded || resizing,
        legacyTranslate: false, 
        gpuAcceleration: true,
        position: position,
        transform: ({ offsetX, offsetY, node }) => {
            if(!node) return
        },
        onDrag: ({ offsetX, offsetY, rootNode, currentNode, event }) => {
            dragging = true
            _position = { x: offsetX, y: offsetY }
            if (!frame) {
                frame = requestAnimationFrame(() => {
                    position = { x: offsetX, y: offsetY }
                    _position = { x: 0, y: 0 }
                    frame = null;
                });
            }
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


function dragStart() {
    dragging = true
}

function dragEnd() {
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
    } else if(mailbox == "requests") {
        return "Email Requests"
    }
})

let email = $derived.by(() => {
    return mxid_to_email(data.user_id)
})


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

let resize_frame = null;
let _width = $state(null);
let _height = $state(null);

function resize(e) {
    if(resizing) {
        _width += e.movementX
        _height += e.movementY


        if(!resize_frame) {
            resize_frame = requestAnimationFrame(() => {

                const nw = width + _width;
                const nh = height + _height;

                width = nw
                height = nh

                _width = null
                _height = null
                resize_frame = null
            })
        }
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
    <Switcher />
{/if}


<div class="grid h-screen w-screen overflow-hidden select-none relative" >
{#if !expanded && ready}
    <Navbar />
{/if}


    <div class="mb grid grid-rows-[auto_1fr_auto] bg-background
        select-none absolute
        "
        style="--width:{width}px; --height:{height}px;--offsetX:{position?.x}px;--offsetY:{position?.y}px;"
        class:drag-shadow={dragging}
        class:boxed={!expanded}
        class:nexp={!expanded}
        class:expanded={expanded} 
        use:draggable={dragopts}
        bind:this={mb}>

        <div class="window-header">
            <Header {dragging} {dragStart} {dragEnd} />
        </div>


        <div class="overflow-hidden 
            grid"
            class:grid-cols-[3rem_1fr]={expanded}
            class:boxed-content={!expanded && !dragging}
            class:boxed-alt={!expanded && dragging}>

            {#if expanded}
                <Switcher />
            {/if}


            <div class="page overflow-hidden">
                {@render children()}
            </div>

        </div>

        <div class="group absolute bottom-[-4px] right-[-4px] pr-1 pb-1 cursor-nwse-resize"
                onmousedown={startResize}
                onmouseup={stopResize}>
            <div class="grabber h-4 w-4 border-r
                border-b
                group-hover:border-bird-900
                group-hover:bg-bird-200
                border-bird-700">
            </div>
        </div>

    </div>

    {#if is_dev_mode}
        <ThemeToggle />
    {/if}

</div>

<Alert />


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
}

.nexp {
    transform: translate(var(--offsetX), var(--offsetY));
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
    box-shadow: none;
}

.boxed-alt {
    border-left: 1px solid theme('colors.bird.700');
    border-right: 1px solid theme('colors.bird.700');
    border-bottom: 1px solid theme('colors.bird.700');
}
.grabber {
    clip-path: polygon(0 100%,100% 0,100% 100%);
}
</style>

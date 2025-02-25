<script>
import { onMount, tick } from 'svelte';
import * as EmailValidator from 'email-validator';

import {
    email_to_mxid
} from '$lib/utils/matrix.js'

import { 
    expand, 
    collapse, 
    minimize, 
    maximize,
    close 
} from '$lib/assets/icons.js'

import { createStore } from '$lib/store/store.svelte.js'
const store = createStore()

import { createEditorStore } from '$lib/store/editor.svelte.js'
const editorStore = createEditorStore()

let { item, index } = $props();

let expanded = $state(false)
let minimized = $state(false)

let maximized_exists = $derived.by(() => {
    return editorStore.maximized !== null
})

$effect(() => {
    if(maximized_exists) {
        if(editorStore.maximized != item.id) {
            minimizeWindow()
        }
    }
})

function expandWindow() {
    if(minimized) {
        minimized = false
        return
    }
    expanded = !expanded
    if(expanded) {
        focusBody()
    }
}

$effect(() => {
    if(expanded) {
        console.log('expanded', item.id)
        editorStore.maximizeEditor(item.id)
    }
})

function minimizeWindow() {
    minimized = true
    expanded = false
    if(editorStore.maximized === item.id) {
        editorStore.maximizeEditor(null)
    }
}

function toggleMinimize() {
    minimized = !minimized
    if(expanded) {
        expanded = false
    }
    if(!minimized) {
        focusTo()
    }
}

function closeWindow() {
    editorStore.killEditor(item.id)
}


let to = $state('');
let to_input;
let subject = $state('');
let subject_input;
let body = $state('');
let body_input;

onMount(() => {
    focusTo()
})

async function focusTo() {
    await tick()
    to_input.focus()
}

async function focusSubject() {
    await tick()
    subject_input.focus()
}

async function focusBody() {
    await tick()
    body_input.focus()
}

async function process() {
    /*
    let email_valid = EmailValidator.validate(to);
    console.log('email_valid', email_valid)

    if(!email_valid) {
        to_input.focus();
        return;
    }
    */

    let mxid = email_to_mxid(to)
    console.log('mxid', mxid)


    /*
    const resp = await store.matrixClient.getProfileInfo(mxid)
    console.log('resp', resp)
    */


    try {
        //const resp = await store.matrixClient.getRooms()
        //console.log('resp', resp)
        /*
        const items = await store.matrixClient.getRooms();
        items.forEach((room) => {
            let members = room.getJoinedMembers();
            console.log(members);
        });
        */

        /*
        const room = await store.matrixClient.createRoom({
            is_direct: true,
            invite: ["@pigpig:localhost:8480"],
            preset: "trusted_private_chat",
            visibility: "private"
        });
        */
        const msg = await store.matrixClient.sendEvent(
            "!teZxEwWVIpQTLKZaPc:localhost:8480",
            "matrixbird.email.native",
            {
                body: {
                    text: "just a test"
                },
                subject: "hello there"
            },
            "lol"
        );
        console.log('msg', msg)
    } catch(e) {
        console.log('error', e)
    }
}

</script>

<div class="box editor grid grid-rows-[auto_1fr] 
    min-w-[34rem]
    select-none"
    class:base={!expanded}
    class:expand={expanded}>

    <div class="flex bg-neutral-900 text-white font-medium"
    >

        <div class="flex p-2 flex-1 place-items-center cursor-pointer text-sm ml-1 tracking-wide"
            onclick={toggleMinimize}>
            New Message
        </div>


        <div class="cursor-pointer flex place-items-center mr-1"
            onclick={toggleMinimize}>
            {#if minimized}
                {@html maximize}
            {:else}
                {@html minimize}
            {/if}
        </div>

        <div class="cursor-pointer flex place-items-center mr-1"
            onclick={expandWindow}>
            {#if expanded}
                {@html collapse}
            {:else}
                {@html expand}
            {/if}
        </div>

        <div class="cursor-pointer flex place-items-center mr-1"
            onclick={closeWindow}>
            {@html close}
        </div>
    </div>

    {#if !minimized}
        <div class="content text-sm p-1 grid grid-rows-[auto_auto_1fr_auto]">

            <div class="border-b border-border">
                <input type="email" class="px-2 py-3" 
                    bind:this={to_input}
                    bind:value={to}
                    placeholder="To" 
                />
            </div>

            <div class="border-b border-border">
                <input type="text" class="px-2 py-3" 
                    bind:this={subject_input}
                    bind:value={subject}
                    placeholder="Subject"
                />
            </div>

            <div class="">
                <textarea class="p-2"
                    bind:this={body_input}
                    bind:value={body}
                >
                </textarea>
            </div>
            <div class="">
                <button class="p-2" onclick={process}>
                    Send
                </button>
            </div>
        </div>
    {/if}
</div>

{#if expanded}
    <div class="mask" onclick={minimizeWindow}>
    </div>
{/if}

<style>
.editor {
    z-index: 100;
}

.content {
    min-height: 48dvh;
}

.base {
}

.expand {
    position: fixed;
    top: 3rem;
    bottom: 3rem;
    right: 10rem;
    left: 10rem;
}

.mask {
    z-index: 99;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
}

input, textarea {
    border:none;
    resize: none;
    height: 100%;
    width: 100%;
    outline: none;
}
</style>

<script>
import { onMount, tick } from 'svelte';
import { v4 as uuidv4 } from 'uuid';

import Composer from './composer.svelte'

import { close_small } from '$lib/assets/icons'

import {
    email_to_mxid,
    mxid_to_email
} from '$lib/utils/matrix.js'

import {
    validate
} from '$lib/utils/email.js'

import { 
    expand, 
    collapse, 
    minimize, 
    maximize,
    close 
} from '$lib/assets/icons.js'

import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

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
        focusComposer()
    }
    if(!expanded) {
        editorStore.maximizeEditor(null)
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

async function process() {


    let mxids = emails.map(e => email_to_mxid(e))

    console.log(mxids)
    return

    /*
    const resp = await store.client.getProfileInfo(mxid)
    console.log('resp', resp)
    */

    if(!subject) {
    }


    try {
        //const resp = await store.testRooms()
        //console.log("dm rooms", resp)
        let room_id = await store.emailRoom([mxids])
        console.log("room id", room_id)

        const msg = await store.client.sendEvent(
            room_id,
            "matrixbird.email.native",
            {
                from: {
                    name: store.user?.displayName,
                    address: mxid_to_email(store.user?.userId)
                },
                subject: subject,
                body: {
                    text: body.text,
                    html: body.html
                }
            },
            uuidv4()
        );
        console.log('msg', msg)

        closeWindow()

    } catch(e) {
        console.log('error', e)
    }
}

function updateComposer(data) {
    body = data
}

let composer;
async function focusComposer() {
    await tick()
    composer.focus()
}

let emails = $state([]);

function processInput(event) {
    if(event.code == 'Backspace' && to.length == 0) {
        emails.pop()
    }

    if(event.code == 'Comma' || event.code == 'Space' || event.code == 'Enter') {
        let email_valid = validate(to);

        let exists = emails.find(e => e == to)

        if(email_valid && !exists) {
            emails.push(to)
            to = ''
            event.preventDefault()
        }
    }

    if(event.key === 'Enter') {
    }

}

function removeEmail(i) {
    emails.splice(i, 1)
    focusTo()
}

function processBlur(event) {
    if(to.length == 0) return;

    let exists = emails.find(e => e == to)

    let email_valid = validate(to);
    if(email_valid && !exists) {
        emails.push(to)
        to = ''
        event.preventDefault()
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

            <div class="border-b border-border flex flex-wrap cursor-text"
            onclick={() => focusTo()}>

                {#each emails as email, i}
                    <div class="flex place-items-center my-2 px-2
                        hover:bg-neutral-200 duration-100
                        bg-neutral-100 rounded cursor-pointer"
                            onclick={() => removeEmail(i)}>
                        <div class="">
                            {email}
                        </div>
                        <div class="cursor-pointer font-semibold ml-1"
                            onclick={() => removeEmail(i)}>
                            {@html close_small}
                        </div>
                    </div>
                {/each}

                <div class="">
                <input type="email" class="px-2 py-3" 
                    bind:this={to_input}
                    bind:value={to}
                    onkeydown={processInput}
                    onblur={processBlur}
                    placeholder={emails?.length == 0 ? `To` : ''}
                />
                </div>
            </div>

            <div class="border-b border-border">
                <input type="text" class="px-2 py-3" 
                    bind:this={subject_input}
                    bind:value={subject}
                    placeholder="Subject"
                />
            </div>

            <div class="">
                <Composer bind:this={composer} {updateComposer} />
            </div>

            <div class="p-2">
                <button class="primary px-4 py-2 rounded-[50%]" onclick={process}>
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
    max-width: 34rem;
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
    outline: none;
}
</style>

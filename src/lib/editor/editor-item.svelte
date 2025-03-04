<script>
import { onMount, tick } from 'svelte';
import { v4 as uuidv4 } from 'uuid';

import Composer from './composer.svelte'
import Recipient from './recipient.svelte'

import {
    email_to_mxid,
    mxid_to_email
} from '$lib/utils/matrix.js'

import {
    validate,
    get_email_domain
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

    for(let email of emails) {
        let domain = get_email_domain(email)
    }


    //return

    /*
    const resp = await store.client.getProfileInfo(mxid)
    console.log('resp', resp)
    */

    if(!subject) {
    }

    if(mxids.length == 1 && mxids[0] == store.user?.userId) {
        console.log("this is for me")

        let self_room = await store.client.getAccountDataFromServer("matrixbird.room.self")
        console.log(self_room)
        if(self_room?.room_id) {
            let room_id = self_room.room_id
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
        }

        return
    }


    try {
        //const resp = await store.testRooms()
        //console.log("dm rooms", resp)

        let initMsg = {
            from: {
                name: store.user?.displayName,
                address: mxid_to_email(store.user?.userId)
            },
            subject: subject,
            body: {
                text: body.text,
                html: body.html
            }
        }


        let room_id = await store.emailRoom(mxids)
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
        return
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

function removeEmail(email) {
    let i = emails.findIndex(e => e == email)
    if(i != -1) {
        emails.splice(i, 1)
    }
}

function handleBlur(event) {

    to_focused = false

    if(to.length == 0) return;

    let exists = emails.find(e => e == to)

    let email_valid = validate(to);
    if(email_valid && !exists) {
        emails.push(to)
        to = ''
        event.preventDefault()
    }
}

function processPaste(event) {
    let clipboardData, pastedData;

    event.stopPropagation();
    event.preventDefault();

    clipboardData = event.clipboardData || window.clipboardData;
    pastedData = clipboardData.getData('Text');

    let pasted = pastedData.split(/[\s,]+/)

    pasted.forEach(email => {
        let email_valid = validate(email);
        let exists = emails.find(e => e == email)
        if(email_valid && !exists) {
            emails.push(email)
        }
    })
}

let to_focused = $state(false);

function handleFocus() {
    to_focused = true
}

let email_placeholder = $derived.by(() => {
    if(to_focused) {
        return ''
    }
    if(emails.length == 0) {
        return `Recipients`
    }
})

</script>


<div class="boxed editor grid grid-rows-[auto_1fr] bg-white
    min-w-[34rem]
    select-none"
    class:base={!expanded}
    class:expand={expanded}>

    <div class="flex bg-bird-900 text-white font-medium"
    >

        <div class="flex p-2 flex-1 place-items-center cursor-pointer text-sm ml-1 tracking-wide"
            onclick={toggleMinimize}>
            {subject ? subject : `New Message`}
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
        <div class="boxed-content content text-sm grid grid-rows-[auto_auto_1fr_auto]"
        class:max={expanded}>

            <div class="recipients border-b border-bird-300 mx-4 flex flex-wrap cursor-text"
            onclick={() => focusTo()}>

                {#if to_focused}
                <div class="flex place-items-center mr-2">
                    To
                </div>
                {/if}


                <div class="flex gap-2">
                    {#each emails as email (email)}
                        <Recipient {email} {removeEmail} {to_focused} />
                    {/each}
                </div>

                <div class="">
                <input type="email" class="py-3" 
                    bind:this={to_input}
                    bind:value={to}
                    onkeydown={processInput}
                    onfocus={handleFocus}
                    onblur={handleBlur}
                    onpaste={processPaste}
                    placeholder={email_placeholder}
                />
                </div>
            </div>

            <div class="subject border-b border-bird-300 mx-4">
                <input type="text" class="py-3" 
                    bind:this={subject_input}
                    bind:value={subject}
                    placeholder="Subject"
                />
            </div>

            <div class="">
                <Composer bind:this={composer} {updateComposer} />
            </div>

            <div class="p-3">
                <button class="primary text-sm font-medium px-5 py-2" onclick={process}>
                    Send
                </button>
            </div>
        </div>
    {/if}
</div>

{#if expanded}
    <div class="mask bg-mask" onclick={minimizeWindow}>
    </div>
{/if}

<style lang="postcss">
@reference "tailwindcss/theme";

button {
    border-radius: 500px;
}

.editor {
    z-index: 100;
}

.content {
    min-height: 48dvh;
    max-width: 34rem;
}

.max {
    max-width: 100%;
}

.expand {
    position: fixed;
    top: 4rem;
    bottom: 4rem;
    right: 10rem;
    left: 10rem;
}


input, textarea {
    border:none;
    resize: none;
    height: 100%;
    outline: none;
}
</style>

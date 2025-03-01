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

let { 
    email,
    killReply
} = $props();

let subject = $derived.by(() => {
    return email?.content?.subject || ''
})

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


let body = $state('');

onMount(() => {
    composer.focus()
})

async function focusTo() {
    await tick()
    to_input.focus()
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

</script>


<div class="box editor grid grid-rows-[auto_1fr] bg-white
    rounded-xl
    select-none"
    class:base={!expanded}
    class:expand={expanded}>

    <div class="header flex">

        <div class="flex py-3 px-4 flex-1 place-items-center text-sm">
            Re: {subject}
        </div>


        <div class="cursor-pointer flex place-items-center mr-3"
            onclick={killReply}>
            {@html close}
        </div>
    </div>

    {#if !minimized}
        <div class="content text-sm grid
            grid-rows-[1fr_auto]"
        class:max={expanded}>


            <div class="composer h-full">
                <Composer bind:this={composer} isReply={true}
                    {updateComposer} />
            </div>

            <div class="px-4 py-3">
                <button class="primary text-sm font-medium px-5 py-2" onclick={process}>
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

<style lang="postcss">
@reference "tailwindcss/theme";

button {
    border-radius: 500px;
}
.editor {
    z-index: 100;
}

.content {
    min-height: 30dvh;
}

.max {
    max-width: 100%;
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

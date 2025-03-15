<script>
import { onMount, tick } from 'svelte';
import { v4 as uuidv4 } from 'uuid';

import Composer from './composer.svelte'
import Recipient from './recipient.svelte'

import {
    email_to_mxid,
    mxid_to_email
} from '$lib/utils/matrix'

import { tooltip } from '$lib/components/tooltip/tooltip'

import {
    validate,
    get_email_domain
} from '$lib/utils/email'

import { 
    expand, 
    collapse, 
    minimize, 
    maximize,
    close 
} from '$lib/assets/icons.js'

import { newAlert, updateAppStatus } from '$lib/store/app.svelte'

import { createMatrixStore, mailbox_rooms } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

import { createEditorStore } from '$lib/store/editor.svelte'
const editorStore = createEditorStore()

let { editor, index } = $props();

let expanded = $state(false)
let minimized = $state(false)

let maximized_exists = $derived.by(() => {
    return editorStore.maximized !== null
})

$effect(() => {
    if(maximized_exists) {
        if(editorStore.maximized != editor.id) {
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
        editorStore.maximizeEditor(editor.id)
    }
})

function minimizeWindow() {
    minimized = true
    expanded = false
    if(editorStore.maximized === editor.id) {
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

async function closeWindow() {

    let drafts = await store.getDraftsRoom()
    editorStore.killEditor(editor.id)
}


let to = $state('');
let to_input;
let subject = $state('');
let subject_input;
let body = $state('');

let hidden = $state(false)

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

    if(emails.length == 0 && to.length != 0) {

        let email_valid = validate(to);

        let message = `The address <strong>${to}</strong> is not valid. Please enter a valid email`;

        if(email_valid) {
            message = `Sending regular emails is disabled for now. Please choose a valid matrix email.`
        }
        newAlert({
            message: message,
        })

        return
    }


    if(emails.length == 0) {
        newAlert({
            title: "No Recipients",
            message: "Please add at least one recipient",
        })
        return
    }

    for(let email of emails) {
        if(!email.valid && email?.domain_valid) {
            newAlert({
                message: `The email address <strong>${email.email}</strong> does not exist. Please choose a valid matrix email`,
            })
            return
        }
        if(!email.valid) {
            newAlert({
                message: `Sending regular emails is disabled for now. Please
choose a valid matrix email`,
            })
            return
        }
    }

    if(emails.length == 0 && to.length != 0) {
        newAlert({
            message: `The address <strong>${to}</strong> is not valid. Please enter a valid email
address.`,
        })
        return
    }

    if(body.text == "" || body.html == "<p></p>") {
        newAlert({
            message: `Please enter a message to send. Your email cannot be
empty.`,
        })
        return
    }



    let mxids = emails.map(e => email_to_mxid(e.email))

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

    hidden = true
    updateAppStatus("Sending email...")

    if(mxids.length == 1 && mxids[0] == store.user?.userId) {
        mxids = []
    }

    /*
    if(mxids.length == 1 && mxids[0] == store.user?.userId) {
        console.log("this is for me")

        let self_room = await store.client.getAccountDataFromServer("matrixbird.room.self")
        console.log(self_room)
        if(self_room?.room_id) {
            let room_id = self_room.room_id
            console.log("room id", room_id)

            const msg = await store.client.sendEvent(
                room_id,
                "matrixbird.email.matrix",
                {
                    recipients: mxids,
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

            updateAppStatus(null)
            closeWindow()
        }

        return
    }
    */


    try {
        //const resp = await store.testRooms()
        //console.log("dm rooms", resp)

        let preview = {
            subject: subject,
            body: {
                //text: body.text,
                html: body.html
            }
        }

        let room_id = await store.createEmailRoom(mxids, preview)

        const msg = await store.client.sendEvent(
            room_id,
            "matrixbird.email.matrix",
            {
                recipients: mxids,
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
        console.log('Email event: ', msg)

        const thr = await store.client.sendEvent(
            room_id,
            "matrixbird.thread.marker",
            {
                msgtype: "thread_marker",
                "m.relates_to": {
                    "event_id": msg.event_id,
                    "m.in_reply_to": msg.event_id,
                    "rel_type": "m.thread"
                },
            },
            uuidv4()
        );
        console.log('Thread marker event:', thr)

        /*
        let outbox_room_id = mailbox_rooms["OUTBOX"]
        if(outbox_room_id) {
            let rev = await store.client.sendEvent(
                outbox_room_id,
                "matrixbird.email.review",
                {
                    from: store.user?.userId,
                    to: mxids,
                    subject: subject,
                    body: {
                        text: body.text,
                        html: body.html
                    },
                    invite_room_id: room_id,
                },
                uuidv4()
            );
            console.log('review event', rev)
        }
        */

        updateAppStatus(null)
        closeWindow()

    } catch(e) {
        console.log('error', e)
        hidden = false
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

let composer_focused = $state(false)

function composer_focus(e) {
    composer_focused = e
    if(e) {
        processEmailField()
    }
}

let emails = $state([]);

function processInput(event) {

    if(event.code == 'Backspace' && to.length == 0 && emails?.length > 0) {
        emails[emails.length - 1].highlight = true
        to_input.blur()
        return
    }

    if(event.code == 'Comma' || event.code == 'Space' || event.code == 'Enter') {
        let email_valid = validate(to);

        let exists = emails.find(e => e.email == to)

        if(email_valid && !exists) {
            emails.push({
                email: to,
                valid: false,
            })
            to = ''
            event.preventDefault()
        }
    }

    if(event.key === 'Enter') {
    }

}

function removeEmail(email) {
    let i = emails.findIndex(e => e.email == email)
    if(i != -1) {
        emails.splice(i, 1)
    }
    to_input.focus()
}

function validateEmail(email) {
    let i = emails.findIndex(e => e.email == email)
    if(i != -1) {
        emails[i].valid = true
    }
}

function validateEmailDomain(email) {
    let i = emails.findIndex(e => e.email == email)
    if(i != -1) {
        emails[i].domain_valid = true
    }
}

function processEmailField(event) {
    if(emails?.length > 0) {
        emails[emails.length - 1].highlight = false
    }


    to_focused = false

    if(to.length == 0) return;

    let exists = emails.find(e => e.email == to)

    let email_valid = validate(to);
    if(email_valid && !exists) {
        emails.push({
            email: to,
            valid: false,
        })
        to = ''
    }


}

function processPaste(event) {
    let clipboardData, pastedData;

    event.stopPropagation();

    clipboardData = event.clipboardData || window.clipboardData;
    pastedData = clipboardData.getData('Text');

    let pasted = pastedData.split(/[\s,]+/)

    pasted.forEach(email => {
        let email_valid = validate(email);
        let exists = emails.find(e => e.email == email)
        if(email_valid && !exists) {
            event.preventDefault();
            emails.push({
                email: email,
                valid: false,
            })
        }
    })
}

let to_focused = $state(false);

function handleFocus() {
    to_focused = true
    if(emails?.length > 0) {
        emails[emails.length - 1].highlight = false
    }
}

let email_placeholder = $derived.by(() => {
    if(to_focused) {
        return ''
    }
    if(emails.length == 0) {
        return `Recipients`
    }
})

let opts_min = $derived.by(() => {
    return {
        disabled: false,
        text: minimized ? "Maximize" : "Minimize",
        placement: 'top-end',
        offset: [12, 4]
    }
})

let opts_exp = $derived.by(() => {
    return {
        disabled: false,
        text: expanded ? "Collapse" : "Expand",
        placement: 'top-end',
        offset: [12, 4]
    }
})

let opts_close = $derived.by(() => {
    return {
        disabled: false,
        text: 'Save & Close',
        placement: 'top-end',
        offset: [12, 4]
    }
})

</script>


{#if !hidden}
<div class="editor border-x-[7px] border-t-[7px] border-bird-200 editor grid grid-rows-[auto_1fr]
        bg-white rounded-t-3xl
    min-w-[34rem]
    select-none"
    class:base={!expanded}
    class:rounded-b-3xl={expanded}
    class:border-b-[7px]={expanded}
    class:expand={expanded}>

    <div class="editor-header rounded-t-2xl flex bg-bird-900 text-white font-medium py-1"
    >

        <div class="flex px-3 flex-1 place-items-center cursor-pointer text-sm ml-1 tracking-wide"
            onclick={toggleMinimize}>
            {subject ? subject : `New Message`}
        </div>


        <div class="cursor-pointer flex place-items-center mr-1"
        use:tooltip={opts_min}
            onclick={toggleMinimize}>
            {#if minimized}
                {@html maximize}
            {:else}
                {@html minimize}
            {/if}
        </div>

        <div class="cursor-pointer flex place-items-center mr-1"
        use:tooltip={opts_exp}
            onclick={expandWindow}>
            {#if expanded}
                {@html collapse}
            {:else}
                {@html expand}
            {/if}
        </div>

        <div class="cursor-pointer flex place-items-center mr-2"
        use:tooltip={opts_close}
            onclick={closeWindow}>
            {@html close}
        </div>
    </div>

    {#if !minimized}
        <div class="content text-sm grid grid-rows-[auto_auto_1fr_auto]"
        class:max={expanded}>

            <div class="recipients border-b border-bird-300 mx-4 flex flex-wrap cursor-text"
            onclick={() => focusTo()}>

                {#if to_focused}
                <div class="flex place-items-center mr-2">
                    To
                </div>
                {/if}


                    {#each emails as item (item.email)}
                        <Recipient {item} 
                            {removeEmail} 
                            {validateEmail} 
                            {validateEmailDomain} 
                            {to_focused} />
                    {/each}

                <div class="flex-1">
                    <input type="email" class="py-3" 
                        bind:this={to_input}
                        bind:value={to}
                        onkeydown={processInput}
                        onfocus={handleFocus}
                        onpaste={processPaste}
                        placeholder={email_placeholder}
                    />
                </div>
            </div>

            <div class="subject border-b border-bird-300 mx-4">
                <input type="text" class="py-3" 
                    bind:this={subject_input}
                    bind:value={subject}
                    onfocus={processEmailField}
                    placeholder="Subject"
                />
            </div>

            <div class="">
                <Composer bind:this={composer} {updateComposer} {composer_focus} />
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

{/if}

<style lang="postcss">
@reference "tailwindcss/theme";

button {
    border-radius: 500px;
}

.editor {
    z-index: 100;
    max-width: 34rem;
}

.content {
    min-height: 48dvh;
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

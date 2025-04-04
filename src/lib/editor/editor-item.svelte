<script lang="ts">
import { onMount, tick } from 'svelte';
import { v4 as uuidv4 } from 'uuid';

import Composer from './composer.svelte'
import Recipient from './recipient.svelte'

import {
    email_to_mxid,
    mxid_to_email,
    is_federated
} from '$lib/utils/matrix'

import type { 
    ComposerData,
    EmailEventContent, 
    DraftEventContent,
    ThreadMarkerContent 
} from '$lib/types/matrixbird'

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
} from '$lib/assets/icons'

import { newAlert, updateAppStatus } from '$lib/store/app.svelte'

import { session } from '$lib/store/session.svelte'

import { 
    createMatrixStore, 
} from '$lib/store/matrix.svelte'

const store = createMatrixStore()

import { ui_state } from '$lib/store/app.svelte';
const mobile = $derived(ui_state.mobile)

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
    //let drafts = await store.getDraftsRoom()
    editorStore.killEditor(editor.id)
}


let to = $state('');
let to_input: HTMLInputElement | null = $state(null);
let subject = $state('');
let subject_input: HTMLInputElement | null = $state(null);
let body = $state({
    text: '',
    html: '',
    json: '',
    selection: 0,
} as ComposerData);

let hidden = $state(false)

onMount(() => {
    focusTo()
})

async function focusTo() {
    await tick()
    to_input?.focus()
}

async function focusSubject() {
    await tick()
    subject_input?.focus()
}

let has_content = $derived.by(() => {
    return subject != '' ||
        body.text != '' || 
        emails?.length > 0
})

let draft_event_id: string | undefined = $state(undefined);

$effect(() => {
    if(has_content && !draft_event_id) {
        saveDraft()
    }
})

async function saveDraft() {
    return
    console.log("Should save draft.")
    let drafts_room_id = await store.getDraftsRoom()
    if(!drafts_room_id) {
        console.error("Drafts room not found.")
        return
    }
    console.log("Drafts mailbox room ID is: ", drafts_room_id)

    let email_content: DraftEventContent = {}
    if(emails?.length > 0) {
        email_content.recipients = emails.map(e => e.email)
    }
    if(subject) {
        email_content.subject = subject
    }
    if(body.text || body.html) {
        email_content.body = {
            text: body.text,
            html: body.html
        }
    }

    const sent = await store.client.sendEvent(
        drafts_room_id,
        "matrixbird.email.draft",
        email_content,
        uuidv4()
    );

    console.log('Draft event saved: ', sent)
}

async function saveAndClose() {
    if(has_content) {
        console.log("Saving draft...")
        let drafts_room = await store.getDraftsRoom()
        console.log("drafts room is", drafts_room)
    } else {
        closeWindow()
    }
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

    let federated = false;

    for(let mxid of mxids) {
        if(is_federated(mxid)) {
            federated = true
        }
    }

    console.log("federated?", federated)


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

        let room = await store.createEmailRoom(mxids)

        let email_content: EmailEventContent = {
            recipients: mxids?.length > 0 ? mxids : [session.user_id],
            from: {
                name: store.user?.displayName,
                address: mxid_to_email(session?.user_id)
            },
            subject: subject,
            body: {
                text: body.text,
                html: body.html
            }
        }

        const sent = await store.client.sendEvent(
            room.room_id,
            "matrixbird.email.matrix",
            email_content,
            uuidv4()
        );

        console.log('Email event: ', sent)

        let marker_content: ThreadMarkerContent = {
            msgtype: "thread_marker",
            "m.relates_to": {
                "event_id": sent.event_id,
                "m.in_reply_to": sent.event_id,
                "rel_type": "m.thread"
            }
        }

        const thr = await store.client.sendEvent(
            room.room_id,
            "matrixbird.thread.marker",
            marker_content,
            uuidv4()
        );
        console.log('Thread marker event:', thr)

        if(!room.exists) {
            for (const mxid of mxids) {
                let invite = await store.client.invite(room.room_id, mxid, "Email request.")
                console.log('Invite:', invite)
            }
        }

        updateAppStatus('')
        closeWindow()

    } catch(e) {
        console.error('Error:', e)
        hidden = false
    }
}

function updateComposer(data: ComposerData) {
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

interface EmailAddress {
    email: string;
    valid: boolean;
    domain_valid?: boolean;
    highlight?: boolean;
}

let emails: EmailAddress[] = $state([]);

function processInput(event: KeyboardEvent) {

    if(event.code == 'Backspace' && to.length == 0 && emails?.length > 0) {
        emails[emails.length - 1].highlight = true
        to_input?.blur()
        return
    }

    if(event.code == 'Comma' || event.code == 'Space' || event.code == 'Enter') {
        let email_valid = validate(to);

        let exists = emails.find(e => e.email == to)

        if(email_valid && !exists) {
            emails.push({
                email: to,
                valid: false,
            } as EmailAddress)
            to = ''
            event.preventDefault()
        }
    }

    if(event.key === 'Enter') {
    }

}

function removeEmail(email: string) {
    let i = emails.findIndex(e => e.email == email)
    if(i != -1) {
        emails.splice(i, 1)
    }
    to_input?.focus()
}

function validateEmail(email: string) {
    let i = emails.findIndex(e => e.email == email)
    if(i != -1) {
        emails[i].valid = true
    }
}

function validateEmailDomain(email: string) {
    let i = emails.findIndex(e => e.email == email)
    if(i != -1) {
        emails[i].domain_valid = true
    }
}

function processEmailField() {
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

function processPaste(event: ClipboardEvent) {
    let clipboardData, pastedData;

    event.stopPropagation();

    clipboardData = event.clipboardData 
    pastedData = clipboardData?.getData('Text');

    let pasted = pastedData?.split(/[\s,]+/)

    pasted?.forEach((email: string) => {
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
    class:max-w-[34rem]={!expanded}
    class:expand={expanded}
    class:mobile={mobile}>

    <div class="editor-header flex bg-bird-900 text-white font-medium py-1"
    class:rounded-t-2xl={!mobile}>

        <div class="flex px-3 flex-1 place-items-center cursor-pointer text-sm ml-1 tracking-wide"
            onclick={toggleMinimize}>
            {subject ? subject : `New Message`}
        </div>


        {#if !mobile}

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

        {/if}

        <div class="cursor-pointer flex place-items-center mr-2"
        use:tooltip={opts_close}
            onclick={saveAndClose}>
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

.mobile {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    border: none;
    min-width: 100dvw;
    max-height: 100dvh;
    border-radius: 0;
}


input, textarea {
    border:none;
    resize: none;
    height: 100%;
    outline: none;
}
</style>

<script>
import { onMount, tick } from 'svelte';
import { v4 as uuidv4 } from 'uuid';

import Composer from './composer.svelte'

import {
    email_to_mxid,
    mxid_to_email
} from '$lib/utils/matrix.js'

import {
    validate,
    get_email_domain
} from '$lib/utils/email.js'

import { 
    close 
} from '$lib/assets/icons.js'

import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

import { createEditorStore } from '$lib/store/editor.svelte.js'
const editorStore = createEditorStore()

import { ui_state } from '$lib/store/store.svelte.js'
let expanded = $derived(ui_state?.expanded)
let compact = $derived(ui_state?.compact)
let minimized = $derived(!expanded && !compact)

import { reply_editors } from '$lib/store/editor.svelte.js'

let { 
    email,
    killReply
} = $props();



onMount(() => {
})


let subject = $derived.by(() => {
    return email?.content?.subject || ''
})




let body = $state('');

onMount(() => {
    composer.focus()
})

let _mode = $state(null);
// focus editor on mode change
$effect(() => {
    if(expanded && _mode != 'expanded') {
        _mode = 'expanded'
        focusComposer()
    }
    if(compact && _mode != 'compact') {
        _mode = 'compact'
        focusComposer()
    }
    if(minimized && _mode != 'minimized') {
        _mode = 'minimized'
        focusComposer()
    }
})


async function process() {

    let thread_id = email.event_id

    if(email?.content?.["m.relates_to"]?.event_id) {
        thread_id = email.content["m.relates_to"].event_id
    }

        let to = email.sender
        if(email.type == "matrixbird.email.legacy") {
            to = email.content.from.address
        }

        console.log("to", to)
    try {

        let room_id = email.room_id

        let content = {
            to: to,
            from: {
                name: store.user?.displayName,
                address: mxid_to_email(store.user?.userId)
            },
            subject: subject,
            body: {
                text: body.text,
                html: body.html
            },
            "m.relates_to": {
                "event_id": thread_id,
                "m.in_reply_to": email.event_id,
                "rel_type": "m.thread"
            },
        }

        if(email?.content?.message_id) {
            content["m.relates_to"]["matrixbird.in_reply_to"] = email.content.message_id
        }

        const msg = await store.client.sendEvent(
            room_id,
            email.type,
            content,
            uuidv4()
        );
        console.log('event_id', msg)
        killReply()

    } catch(e) {
        console.log('error', e)
    }
}

function updateComposer(data) {
    body = {
        text: data.text,
        html: data.html
    }
    let editor = reply_editors[email.event_id]
    if(editor) {
        reply_editors[email.event_id].state = data
    }
}

let state = $derived.by(() => {
    let editor = reply_editors[email.event_id]
    if(editor?.state) {
        return editor.state
    }
})

let composer;
async function focusComposer() {
    await tick()
    composer.focus()
}

</script>

<div class="editor grid grid-rows-[auto_1fr_auto] 
    select-none">

    <div class="header flex rounded-t-xl border-t border-x border-bird-200
        sticky top-0">

        <div class="flex py-3 px-4 flex-1 place-items-center text-sm text-light ">
            Re: {subject}
        </div>


        <div class="cursor-pointer flex place-items-center mr-3"
            onclick={killReply}>
            {@html close}
        </div>
    </div>

    <div class="content text-sm grid border-x border-bird-300"
    class:min-h-[10dvh]={minimized}
    class:min-h-[12dvh]={!minimized}>

            <Composer bind:this={composer} 
            isReply={true} {state}
                {updateComposer} />
    </div>

    <div class="tools px-4 pb-3 border-b border-x border-bird-300 rounded-b-xl">
        <button class="primary text-sm font-medium" 
            class:py-1={minimized || compact}
            class:py-2={expanded}
            class:px-3={minimized}
            class:px-4={compact}
            class:px-5={expanded}
            onclick={process}>
            Send
        </button>
    </div>
</div>


<style lang="postcss">
@reference "tailwindcss/theme";

button {
    border-radius: 500px;
}

.editor {
    z-index: 100;
}

</style>

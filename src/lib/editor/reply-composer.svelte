<script>

import { browser } from '$app/environment'
import { onMount, tick } from 'svelte';
import { v4 as uuidv4 } from 'uuid';

import Composer from './composer.svelte'

import {
    email_to_mxid,
    mxid_to_email
} from '$lib/utils/matrix'

import {
    validate,
    get_email_domain
} from '$lib/utils/email'

import { 
    close,
    emoji
} from '$lib/assets/icons.js'

import { newAlert, updateAppStatus } from '$lib/store/app.svelte.js'

import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

import { createEditorStore } from '$lib/store/editor.svelte'
const editorStore = createEditorStore()

import { ui_state } from '$lib/store/app.svelte.js'
let expanded = $derived(ui_state?.expanded)

import { reply_editors } from '$lib/store/editor.svelte'

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
    if(!expanded && _mode != 'minimized') {
        _mode = 'minimized'
        focusComposer()
    }
})


async function process() {

    if(body.text == "" || body.html == "<p></p>") {
        newAlert({
            message: `Please enter a message to send. Your email cannot be
empty.`,
        })
        return
    }


    let thread_id = email.event_id

    if(email?.content?.["m.relates_to"]?.event_id) {
        thread_id = email.content["m.relates_to"].event_id
    }

    let to = email.sender
    if(email.type == "matrixbird.email.standard") {
        to = email.content.from.address
    }

    updateAppStatus("Sending reply...")

    try {

        let room_id = email.room_id

        let content = {
            recipients: [to],
            from: {
                name: store.user?.displayName,
                address: mxid_to_email(store.user?.userId)
            },
            subject: subject,
            body: {
                //text: body.text,
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

        let replyType = ``
        if(email.type.includes("matrixbird.email.standard")) {
            replyType = `matrixbird.email.standard.reply`
        }
        if(email.type.includes("matrixbird.email.matrix")) {
            replyType = `matrixbird.email.matrix.reply`
        }

        const msg = await store.client.sendEvent(
            room_id,
            "matrixbird.email.reply",
            //replyType,
            //email.type,
            content,
            uuidv4()
        );
        console.log('event_id', msg)
        updateAppStatus(null)
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

function updateScroll() {
    console.log("updating")
    let el = document.querySelector('.email-thread')
    if(el) {
        el.scrollTop = el.scrollHeight
    }
}

let toggler;
let emp;
let picker;

onMount(async() => {
    if(browser) {
        await import('emoji-picker-element/picker')
            .then(({ default: Picker }) => {
            picker = new Picker({
                emojiVersion: 15.0
            });
            picker.addEventListener('emoji-click', (event) => {
                composer.insert(event.detail.unicode)
                emojiVisible = false
            });
        });
    }
})

let emojiVisible = $state(false);

function toggleEmoji(e) {
    e.preventDefault()
    emojiVisible = !emojiVisible
}

$effect(() => {
    if(browser && emp && emojiVisible) {
        emp.appendChild(picker);
        document.addEventListener('click', handleClickOutside);
    } else if(browser && emp && !emojiVisible) {
        emp.innerHTML = ''
        document.removeEventListener('click', handleClickOutside);
    }
})

function handleClickOutside(event) {
    if (!emp.contains(event.target) && !toggler.contains(event.target)) {
        emojiVisible = false
    }
}

</script>

<div class="editor grid grid-rows-[auto_1fr_auto] 
    select-none">

    <div class="editor-header flex rounded-t-xl border-t border-x border-bird-200">

        <div class="flex py-3 px-4 flex-1 place-items-center text-sm text-light ">
            Re: {subject}
        </div>


        <div class="cursor-pointer flex place-items-center mr-3"
            onclick={killReply}>
            {@html close}
        </div>
    </div>

    <div class="content text-sm grid border-x border-bird-300"
    class:min-h-[10dvh]={!expanded}
    class:min-h-[12dvh]={expanded}>

            <Composer bind:this={composer} 
            isReply={true} {state} {updateScroll}
                {updateComposer} />
    </div>

    <div class="tools relative flex px-4 pb-3 border-b border-x border-bird-300 rounded-b-xl">

        <div class="">
            <button class="primary text-sm font-medium" 
                class:py-1={!expanded}
                class:py-2={expanded}
                class:px-3={!expanded}
                class:px-5={expanded}
                onclick={process}>
                Send
            </button>
        </div>

        <div class="flex-1">
        </div>

        <div class="emoji flex place-items-center cursor-pointer" 
            bind:this={toggler}
            onclick={toggleEmoji}>
            {@html emoji}
        </div>

        <div class="absolute bottom-12 right-2 right-0" bind:this={emp}>
        </div>

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

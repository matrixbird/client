<script>
import { page } from '$app/state';
import DOMPurify from "dompurify";
import { mxid_to_email } from '$lib/utils/matrix.js'


import ReplyComposer from '$lib/editor/reply-composer.svelte'

import { newAlert } from '$lib/store/app.svelte.js'

import { createMatrixStore, large_email_content } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

import { reply_editors } from '$lib/store/editor.svelte.js'

let { email, last } = $props();


let active = $derived.by(() => {
    return email?.event_id == page.params.event
})

let thread_root = $derived.by(() => {
    return email?.content?.["m.relates_to"] == undefined 
})

const body = $derived.by(() => {

    if(!email) return

    if(is_large) {
        let content = large_email_content.get(email?.event_id)
        if(content) {
            return content
        }
    }

    return email?.content?.body?.html ? email?.content?.body?.html :
        email?.content?.body?.text
})

const is_html = $derived.by(() => {
    return email?.content?.body?.html
})

let subject = $derived(email?.content?.subject || `(no subject)`)

let clean = $state(null);

$effect(() => {
    if(email) {
        DOMPurify.addHook('afterSanitizeAttributes', node => {
          if (node.tagName === 'A') {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
        });

        clean = DOMPurify.sanitize(body, {
            ADD_ATTR: ['target'],
        })
    }

    if(active && element) {
        setTimeout(() => {
            //element.scrollIntoView({block: "center", inline: "nearest"})
        }, 10)
    }
})

let name = $derived.by(() => {
    return email?.content?.from?.name
})

let address = $derived.by(() => {
    return email?.content?.from?.address
})

const native = $derived.by(() => {
    return email?.type == "matrixbird.email.matrix"
})

let user = $derived.by(() =>{
    if(!email?.room_id) return
    const room = store.rooms[email?.room_id]
    if(room) {
        const member = room.getMember(email.sender)
        //console.log(member)
        if(member) {
            return {
                name: member?.name || member?.rawDisplayName,
                address: mxid_to_email(member.userId)
            }
        }
    }
})


let replying = $derived.by(() => {
    return reply_editors.get(email?.event_id) != undefined
})

function reply() {
    if(email.type == "matrixbird.email.standard") {
        newAlert({
            message: "Replying to regular emails is disabled for now.",
        })
        return
    }

    reply_editors.set(email?.event_id,  {
        email: email,
        state: null,
    })

    let exists = reply_editors[email?.event_id]
    console.log("exists", exists)

    console.log("replying", email.event_id, replying)
}

function killReply() {
    reply_editors.delete(email?.event_id)
}

let element;

function debug(e) {
    if(e.ctrlKey) {
        console.log($state.snapshot(email))
    }
}

let debug_mode = $state(false);

let is_large = $derived.by(() => {
    return email?.content?.body?.content_uri != undefined
})

</script>

<div class="email-view" bind:this={element} title={email?.event_id}
    onclick={debug}>

    <div class="meta p-4 flex flex-col">
        {#if thread_root}

            <div class="flex place-items-center mb-3">
                <div class="flex-1 text font-semibold leading-1">
                    {subject}
                </div>
            </div>

        {/if}

        {#if native && user}
            <div class="text-sm">
                <span class="font-medium">{user?.name}</span>
                <span class="text-xs text-bird-800">&lt;{user?.address}&gt;</span>
            </div>
        {/if}

        {#if !native}
            <div class="">
                {#if name}
                    <span>{name}</span>
                {/if}
                    <span>{address}</span>
            </div>
        {/if}
        <div class="text-xs text-bird-800">
            {email?.sender ? email.sender : ''}
        </div>

    </div>

        {#if clean && is_large}
            <div class="body p-4 [&>p]:pb-2 leading-5">
                {@html clean}
            </div>
        {/if}

        {#if is_html && clean && !is_large}
            <div class="body p-4 [&>p]:pb-2 leading-5">
                {@html clean}
            </div>
        {/if}
        {#if !is_html && !is_large}
            <div class="p-4 leading-5" style="white-space: pre-wrap;">
                {body}
            </div>
        {/if}


    {#if last}
    <div class="px-4 mb-4">

        {#if !replying}
            <button class="text-sm font-medium px-4 py-1"
            onclick={reply}>
                Reply
            </button>
        {/if}

        {#if replying}
            <div class="reply-container border-[6px] border-bird-100 rounded-2xl">
                <ReplyComposer {email} {killReply}/>
            </div>
        {/if}
    </div>
    {/if}

</div>

<style lang="postcss">
@reference "tailwindcss/theme";
button {
    border-radius: 500px;
}
</style>

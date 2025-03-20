<script>
import { page } from '$app/state';
import DOMPurify from "dompurify";
import { 
    get_localpart,
    mxid_to_email
} from '$lib/utils/matrix'

import UserAvatar from '$lib/user/avatar.svelte'
import ReplyComposer from '$lib/editor/reply-composer.svelte'

import Recipient from '$lib/components/recipient/recipient.svelte';

import { app, newAlert } from '$lib/store/app.svelte'

import { createMatrixStore, large_email_content, users } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

import { reply_editors } from '$lib/store/editor.svelte'

let { email, last } = $props();

let features = $derived.by(() => {
    return app.features
})

let outgoing_reply_allowed = $derived.by(() => {
    return app.features?.email?.outgoing == true
})

let active = $derived.by(() => {
    return email?.event_id == page.params.event
})

let is_matrixbird = $derived.by(() => {
    return get_localpart(email?.sender) == "matrixbird"
})


let thread_root = $derived.by(() => {
    return email?.content?.["m.relates_to"] == undefined 
})

let recepients = $derived.by(() => {
    return email?.content?.recipients
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
    return email?.type == "matrixbird.email.matrix" ||
        email?.type == "matrixbird.email.reply"
})

let user = $derived.by(() =>{
    let _user = users.get(email?.sender)
    if(_user) {
        return {
            name: _user.displayname,
            address: mxid_to_email(email.sender)
        }
    }
})


let replying = $derived.by(() => {
    return reply_editors.get(email?.event_id) != undefined
})

function reply() {
    if(email.type == "matrixbird.email.standard" && 
        !outgoing_reply_allowed) {
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

        <div class="flex">

            <UserAvatar user_id={email.sender} large={true}
                from={!native ? email?.content?.from : null}/>


            <div class="flex flex-col ml-3">
                {#if native && user}
                    <div class="text-sm">
                        <span class="font-medium">{is_matrixbird ? `Matrixbird` : user?.name}</span>
                        <span class="text-xs text-light">&lt;{user?.address}&gt;</span>
                    </div>
                {/if}

                {#if !native}
                    <div class="text-sm">
                        {#if name}
                            <span class="font-medium">{name}</span>
                        {/if}
                            <span class="text-xs text-light">&lt;{address}&gt;</span>
                    </div>
                {/if}
                <div class="text-xs text-light">
                    to 
                    {#if recepients}
                        {#each recepients as recipient}
                            {#if recipient}
                                <Recipient {recipient}/>
                            {/if}
                        {/each}
                    {/if}
                </div>
            </div>

            <div class="flex">
            </div>

        </div>




    </div>

    {#if clean && is_large}
        <div class="body text-md p-4 [&>p]:pb-2 leading-5">
            {@html clean}
        </div>
    {/if}

    {#if is_html && clean && !is_large}
        <div class="body text-md p-4 [&>p]:pb-2 leading-5">
            {@html clean}
        </div>
    {/if}
    {#if !is_html && !is_large}
        <div class="body text-md p-4 leading-5" style="white-space: pre-wrap;">
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

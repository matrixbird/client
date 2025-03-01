<script>
import DOMPurify from "dompurify";
import { mxid_to_email } from '$lib/utils/matrix.js'

import ReplyComposer from '$lib/editor/reply-composer.svelte'

import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

let { email } = $props();

const body = $derived.by(() => {
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
})

let name = $derived.by(() => {
    return email?.content?.from?.name
})

let address = $derived.by(() => {
    return email?.content?.from?.address
})

const native = $derived.by(() => {
    return email?.type == "matrixbird.email.native"
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

let replying = $state(true);

function reply() {
    replying = true
}

function killReply() {
    replying = false
}

</script>


<div class="meta p-3 flex flex-col">
    <div class="flex place-items-center mb-3">
        <div class="flex-1 text-xl font-medium leading-1">
            {subject}
        </div>
    </div>

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

</div>


    {#if is_html && clean}
        <div class="p-4">
            {@html clean}
        </div>
    {/if}
    {#if !is_html}
        <div class="p-4 leading-5" style="white-space: pre-wrap;">
            {body}
        </div>
    {/if}


<div class="p-4 mt-3">

    {#if !replying}
        <button class="text-sm font-medium px-4 py-1"
        onclick={reply}>
            Reply
        </button>
    {/if}

    {#if replying}
        <ReplyComposer {email} {killReply}/>
    {/if}
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
button {
    border-radius: 500px;
}
</style>

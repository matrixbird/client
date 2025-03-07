<script>
import { page } from '$app/stores';
import { ui_state } from '$lib/store/app.svelte.js'
import { inbox, sent, drafts, down, dot } from '$lib/assets/icons.js'
import { goto } from '$app/navigation';

import Popup from '$lib/components/popup/popup.svelte'

let mailbox = $derived.by(() => {
    return $page.params.mailbox
})

let mailbox_title = $derived.by(() => {
    if(mailbox == "inbox") {
        return "Inbox"
    } else if(mailbox == "sent") {
        return "Sent"
    } else if(mailbox == "drafts") {
        return "Drafts"
    }
})

let is_inbox = $derived.by(() => {
    return mailbox == "inbox"
})

let is_sent = $derived.by(() => {
    return mailbox == "sent"
})

let is_drafts = $derived.by(() => {
    return mailbox == "drafts"
})

let popup;

let popup_active = $state(false);

function toggle(status) {
    popup_active = status
}

function kill() {
    popup.kill()
}

let opts = $derived.by(() => {
    return {
        mask: false,
        placement: 'bottom-start',
        decoration: false,
        action: 'hover',
        hoverDelay: 10,
        hoverOutDelay: 300,
    }
})

function open(path) {
    goto(`/mail/${path}`)
    kill()
}

</script>

<Popup bind:this={popup} {toggle} {opts}
    {trigger} {content}>

</Popup>

{#snippet content()}
<div class="flex flex-col bg-bird-800 cursor-pointer min-w-22">

    <div class="flex"
        class:hover:bg-bird-700={!is_inbox}
            onclick={() => open("inbox")}>
        <div class="flex place-items-center mx-2 py-1">
            {@html inbox}
        </div>
        <div class="flex place-items-center text-sm flex-1">
            Inbox
        </div>
        {#if is_inbox}
            <div class="flex ml-3 place-items-center">
                    {@html dot}
            </div>
        {/if}
    </div>

    <div class="flex"
        class:hover:bg-bird-700={!is_sent}
            onclick={() => open("sent")}>
        <div class="flex place-items-center mx-2 py-1">
            {@html sent}
        </div>
        <div class="flex place-items-center text-sm flex-1">
            Sent
        </div>
        {#if is_sent}
            <div class="flex ml-3 place-items-center">
                {@html dot}
            </div>
        {/if}
    </div>

    <div class="flex "
        class:hover:bg-bird-700={!is_drafts}
            onclick={() => open("drafts")}>
        <div class="flex place-items-center mx-2 py-1">
            {@html drafts}
        </div>
        <div class="flex place-items-center text-sm flex-1">
            Drafts
        </div>
        {#if is_drafts}
            <div class="flex ml-3 place-items-center">
                {@html dot}
            </div>
        {/if}
    </div>

</div>
{/snippet}

{#snippet trigger()}

<div class="flex">
    <div class="flex place-items-center mx-2 py-1">
        {#if is_inbox}
            {@html inbox}
        {:else if is_sent}
            {@html sent}
        {:else if is_drafts}
            {@html drafts}
        {/if}
    </div>

    <div class="flex place-items-center text-sm">
        {mailbox_title}
    </div>
    <div class="flex place-items-center ml-3 ">
            {@html down}
    </div>
</div>
{/snippet}

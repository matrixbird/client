<script>
import { createMatrixStore, status, inbox_mail } from '$lib/store/matrix.svelte.js'
import EmailItem from './email-item.svelte'
import { goto } from '$app/navigation';
import { page } from '$app/stores';

import { count } from '$lib/store/app.svelte.js'

const store = createMatrixStore()
const events = $derived(store?.events)

const threads = $derived(store?.threads)
const thread_events = $derived(store?.thread_events)

let user = $derived(store?.user)

let mailbox = $derived.by(() => {
    return $page.params.mailbox
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

$effect(() => {
    if(inbox_emails) {
        count.inbox = inbox_emails.length
    }
})

function process(email) {
    let _thread_events = thread_events.get(email.event_id)
    if(_thread_events) {
        for (const event of _thread_events.values()) {
            if(event.sender != user?.userId) {
                return true
            }
        }
    }

    let latest_event = email?.unsigned?.["m.relations"]?.["m.thread"]?.latest_event;
    if(latest_event.type == "matrixbird.thread.marker" &&
    latest_event.sender == user?.userId) {
        return false
    }

    if(latest_event.sender != user?.userId) {
        return true
    }

    return email.sender != user?.userId
}

function buildInboxEmails(items) {
    let sorted = [...items.values()].sort((a, b) => 
        b.origin_server_ts - a.origin_server_ts
    );

    return sorted
}

let inbox_emails = $derived.by(() => {
    if(is_inbox && status.inbox_ready) {
        return buildInboxEmails(inbox_mail)
    }
})

</script>

<div class="items-container flex flex-col overflow-x-hidden">

    {#if is_inbox && inbox_emails}
        {#each inbox_emails as email (email.event_id)}
            <EmailItem {email} />
        {/each}
    {/if}

</div>

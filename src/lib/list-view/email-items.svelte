<script>
import { createMatrixStore, status } from '$lib/store/matrix.svelte.js'
import EmailItem from './email-item.svelte'
import { goto } from '$app/navigation';
import { page } from '$app/stores';

import { count } from '$lib/store/store.svelte.js'

const store = createMatrixStore()
const events = $derived(store?.events)

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
    for (const event of events.values()) {
        if(event.content["m.relates_to"]?.event_id == email.event_id && event.sender != user?.userId) {
            return true
        }
    }
    return email.sender != user?.userId
}

function buildInboxEmails(events) {
    if(events && user) {
        let sorted = [...events.values()].sort((a, b) => 
            b.origin_server_ts - a.origin_server_ts
        );
        let filtered = sorted.filter((email) => {
            return email.content?.["m.relates_to"] == undefined
        })

        filtered = filtered.filter((email) => {
            return process(email)
        })
        return filtered
    }
}

let inbox_emails = $derived.by(() => {
    if(is_inbox) {
        return buildInboxEmails(events)
    }
})

</script>

<div class="flex flex-col overflow-x-hidden">
    {#if is_inbox && inbox_emails}
        {#each inbox_emails as email (email.event_id)}
            <EmailItem {email} />
        {/each}
    {/if}

</div>

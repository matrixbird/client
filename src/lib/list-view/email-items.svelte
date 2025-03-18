<script>
import { SvelteMap } from 'svelte/reactivity';
import { createMatrixStore, status } from '$lib/store/matrix.svelte'
import EmailItem from './email-item.svelte'
import { goto } from '$app/navigation';
import { page } from '$app/state';

import { count } from '$lib/store/app.svelte'

const store = createMatrixStore()
const events = $derived(store?.events)

const threads = $derived(store?.threads)
const thread_events = $derived(store?.thread_events)

let user = $derived(store?.user)

let mailbox = $derived.by(() => {
    return page.params.mailbox
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
    if(store?.inbox_items) {
        console.log("inbox items", store.inbox_items)
    }
})

function findLastUserEvent(threadEvents) {
    const userEvents = threadEvents.filter(event => event.sender === user.userId);

    if (userEvents.length === 0) return null;

    return userEvents.reduce((latest, current) => 
        current.origin_server_ts > latest.origin_server_ts ? current : latest, 
        userEvents[0]);
}

function findLastNonUserEvent(threadEvents) {
    const nonUserEvents = threadEvents.filter(event => event.sender !== user.userId);

    if (nonUserEvents.length === 0) return null;

    return nonUserEvents.reduce((latest, current) => 
        current.origin_server_ts > latest.origin_server_ts ? current : latest, 
        nonUserEvents[0]);
}

function buildInboxEmails(_threads) {

    let emails = {};

    for (const [threadId, thread] of _threads) {
        let children = thread_events.get(threadId);
        // this thread has event relations, we'll need to process 
        // them to find the latest reply from another sender
        if(children) {
            let nonUserReply = findLastNonUserEvent(children);
            if(nonUserReply) {
                emails[nonUserReply.event_id] = nonUserReply;
            } else {
                // this may be an email chain started by another user but 
                // all child events are sent by this user, so we'll 
                // return the original thread event
                emails[threadId] = thread;
            }
        }
        // this thread has no event relations, so this is either
        // an email sent by this user or recieved from another user
        // add to inbox if it's not sent by this user
        if(!children) {
            if(thread.sender != user.userId) {
                emails[threadId] = thread;
            }
        }
    }
    //console.log("inbox built", emails)

    let sorted = Object.values(emails).sort((a, b) => {
        return b.origin_server_ts - a.origin_server_ts
    })

    return sorted
}

let inbox_emails = $derived.by(() => {
    if(is_inbox && status.threads_ready && status.thread_events_ready) {
        return buildInboxEmails(threads)
        //return store.inbox_items
    }
})

function buildSentEmails(_threads) {

    let emails = {};

    for (const [threadId, thread] of _threads) {
        let children = thread_events.get(threadId);
        // this thread has event relations, we'll need to process 
        // them to find the latest reply from this user
        if(children) {
            let userReply = findLastUserEvent(children);
            if(userReply) {
                emails[userReply.event_id] = userReply;
            } else {
                // this may be an email chain started by this user and
                // all child events are sent by this user, so we'll 
                // return the original thread event
                if(thread.sender == user.userId) {
                    emails[threadId] = thread;
                }
            }
        }
        // this thread has no event relations, so this is either
        // an email sent by this user or recieved from another user
        // add to inbox if it's sent by this user
        if(!children) {
            if(thread.sender == user.userId) {
                emails[threadId] = thread;
            }
        }
    }
    //console.log("inbox built", emails)

    let sorted = Object.values(emails).sort((a, b) => {
        return b.origin_server_ts - a.origin_server_ts
    })

    return sorted
}

let sent_emails = $derived.by(() => {
    if(is_sent && status.threads_ready && status.thread_events_ready) {
        return buildSentEmails(threads)
    }
})

</script>

<div class="items-container flex flex-col overflow-x-hidden">

    {#if is_inbox && inbox_emails}
        {#each inbox_emails as email (email.event_id)}
            <EmailItem {email} />
        {/each}
    {/if}

    {#if is_sent && sent_emails}
        {#each sent_emails as email (email.event_id)}
            <EmailItem {email} />
        {/each}
    {/if}

</div>

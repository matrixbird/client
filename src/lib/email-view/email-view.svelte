<script>
import EmailItemView from "$lib/email-view/email-item-view.svelte";
import Divider from "$lib/components/email/divider.svelte";

import { page } from '$app/stores';
import { goto } from '$app/navigation';

import { close } from '$lib/assets/icons.js'

import { createMatrixStore, status, inbox_mail } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

const events = $derived(store?.events)
const threads = $derived(store?.threads)
const thread_events = $derived(store?.thread_events)


function buildEmails(event_id) {

    const event = events.get(event_id)
    const thread_id = event?.content["m.relates_to"]?.event_id

    // it it doesn't have a thread root, it's likely the first email 
    // in a thread - return it (with it's children)
    if(!thread_id) {
        let items = [event]

        const thread_children = thread_events.get(event_id)
        if(thread_children) {
            for (const event of thread_children.values()) {
                items.push(event)
            }
        }
        let sorted = items.sort((a, b) => {
            return a.origin_server_ts - b.origin_server_ts
        })

        return sorted
    }

    // this is a reply, get the thread root
    const thread_event = threads.get(thread_id)

    // start with the thread root at top
    let items = [thread_event]

    // include children, if any
    const thread_children = thread_events.get(thread_id)
    if(thread_children) {
        for (const event of thread_children.values()) {
            items.push(event)
        }
    }

    let sorted = items.sort((a, b) => {
        return a.origin_server_ts - b.origin_server_ts
    })

    return sorted
}

let emails = $derived.by(() => {
    if(!status.thread_events_ready) return 
    return buildEmails($page.params.event)
})

let split = $derived.by(() => {
    if(!emails) {
        return 
    }

    if(emails?.length < 5) {
        return 
    }

    let first = emails.slice(0, 1);
    let middle = emails.slice(1, emails.length - 2);
    let last_two = emails.slice(-2);

    return [first, middle, last_two];
})

let collapsed = $state(true);

function showEmails() {
    collapsed = false
}

$effect(() => {
    if($page.params.event) {
        collapsed = true
    }
})


function killEmailItemView() {
    goto('/mail/inbox')
}

</script>

<div class="thread-container h-full grid grid-rows-[auto_1fr] overflow-hidden">

    <div class="">
        <div class="flex place-items-center cursor-pointer" 
        onclick={killEmailItemView}>
            {@html close}
        </div>
    </div>

<div class="email-thread h-full overflow-x-auto overflow-y-auto select-text">

    {#if emails}

        {#if emails.length <= 4}
            {#each emails as email, i (email.event_id)}
                <div class="email-item">
                    <EmailItemView {email} last={i == emails.length - 1} />
                </div>
            {/each}
        {/if}


        {#if emails.length >= 5 && split}
            {#each split[0] as email, i (email.event_id)}
                <div class="email-item">
                    <EmailItemView {email} last={i == emails.length - 1} />
                </div>
            {/each}

            {#if !collapsed}
                {#each split[1] as email, i (email.event_id)}
                    <div class="email-item">
                        <EmailItemView {email} last={i == emails.length - 1} />
                    </div>
                {/each}
            {:else}
                <Divider emails={split[1]} {showEmails} />
            {/if}



            {#each split[2] as email, i (email.event_id)}
                <div class="email-item">
                    <EmailItemView {email} last={i == split[2].length - 1} />
                </div>
            {/each}

        {/if}


    {:else}
        no email
    {/if}

</div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
.email-thread .email-item {
    border-bottom: 1px solid var(--bird-200);
}
.email-thread .email-item:last-child {
    border-bottom: none;
}
</style>


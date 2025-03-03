<script>
import EmailView from "$lib/email-view/email-view.svelte";
import Divider from "$lib/components/email/divider.svelte";

import { page } from '$app/stores';


import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

const events = $derived(store?.events)


function buildEmails() {
    if(events && $page.params.event) {
        let email = events.get($page.params.event)

        if(email?.content?.["m.relates_to"]?.event_id) {
            let thread_root = events.get(email.content["m.relates_to"].event_id)

            let emails = [];

            if(thread_root) {
                emails.push(thread_root)

                for (const event of events.values()) {
                    if(event.content["m.relates_to"]?.event_id == thread_root.event_id) {
                        emails.push(event)
                    }
                }
            }
            return emails
        }

        if(email) {
            let emails = [email]
            for (const event of events.values()) {
                if(event.content["m.relates_to"]?.event_id == email.event_id) {
                    emails.push(event)
                }
            }
            return emails
        }

    }
}

let emails = $derived.by(() => {
    return buildEmails(events, $page.params.event)
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

</script>


<div class="email-thread h-full overflow-x-auto overflow-y-auto select-text">

    {#if emails}

        {#if emails.length <= 4}
            {#each emails as email, i (email.event_id)}
                <div class="email-item">
                    <EmailView {email} last={i == emails.length - 1} />
                </div>
            {/each}
        {/if}


        {#if emails.length >= 5 && split}
            {#each split[0] as email, i (email.event_id)}
                <div class="email-item">
                    <EmailView {email} last={i == emails.length - 1} />
                </div>
            {/each}

            {#if !collapsed}
                {#each split[1] as email, i (email.event_id)}
                    <div class="email-item">
                        <EmailView {email} last={i == emails.length - 1} />
                    </div>
                {/each}
            {:else}
                <Divider emails={split[1]} {showEmails} />
            {/if}



            {#each split[2] as email, i (email.event_id)}
                <div class="email-item">
                    <EmailView {email} last={i == split[2].length - 1} />
                </div>
            {/each}

        {/if}


    {:else}
        no email
    {/if}

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

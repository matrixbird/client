<script>
import DOMPurify from "dompurify";

import EmailView from "$lib/email-view/email-view.svelte";

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

$effect(() => {
})

</script>


<div class="h-full overflow-x-auto overflow-y-auto select-text">
    {#if emails?.length > 0}

        {#each emails as email, i (email.event_id)}
            <EmailView {email} last={i == emails.length - 1} />
        {/each}

    {:else}
        no email
    {/if}
</div>

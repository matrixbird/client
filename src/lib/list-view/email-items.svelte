<script>
import { createMatrixStore, status } from '$lib/store/matrix.svelte.js'
import EmailItem from './email-item.svelte'
import { goto } from '$app/navigation';
import { page } from '$app/stores';


const store = createMatrixStore()
const events = $derived(store?.events)

let user = $derived(store?.user)

let processed = $state(null);

let ready = $derived(status?.events_ready == true)

$effect(() => {
    if(events && user) {
        /*
        let reversed = events.sort((a, b) => {
            return b.origin_server_ts - a.origin_server_ts
        })
        */
        let sorted = [...events.values()].sort((a, b) => 
            b.origin_server_ts - a.origin_server_ts
        );

        //console.log(user)

        //filter by sender
        let filtered = sorted.filter((email) => {
            return email.sender != user.userId
        })

        processed = sorted
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

function buildEmails(events) {
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

let emails = $derived.by(() => {
    return buildEmails(events)
})

</script>

<div class="flex flex-col overflow-x-hidden">
    {#if emails}
        {#each emails as email (email.event_id)}
            <EmailItem {email} />
        {/each}
    {/if}

</div>

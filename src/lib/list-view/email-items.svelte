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

function buildEmails(events) {
    if(events) {
        let sorted = [...events.values()].sort((a, b) => 
            b.origin_server_ts - a.origin_server_ts
        );
        let filtered = sorted.filter((email) => {
            return email.content?.["m.relates_to"] == undefined
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

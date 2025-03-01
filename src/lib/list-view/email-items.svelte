<script>
import { createMatrixStore, status } from '$lib/store/matrix.svelte.js'
import EmailItem from './email-item.svelte'
import { goto } from '$app/navigation';


const store = createMatrixStore()
const events = $derived(store?.events)

let user = $derived(store?.user)

let processed = $state(null);

let ready = $derived(status?.events_ready == true)

$effect(() => {
    if(events && ready) {
        /*
        let reversed = events.sort((a, b) => {
            return b.origin_server_ts - a.origin_server_ts
        })
        */
        let sorted = [...events.values()].sort((a, b) => 
            b.origin_server_ts - a.origin_server_ts
        );
        processed = sorted
    }
})

</script>

<div class="flex flex-col overflow-x-hidden">
    {#if processed}
        {#each processed as email (email.event_id)}
            <EmailItem {email} />
        {/each}
    {/if}
</div>

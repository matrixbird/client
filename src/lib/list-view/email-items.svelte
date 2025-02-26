<script>
import { createMatrixStore } from '$lib/store/matrix.svelte.js'
import EmailItem from './email-item.svelte'
import { goto } from '$app/navigation';


const store = createMatrixStore()
const events = $derived(store?.events)

let user = $derived(store?.user)

let processed = $state(null);

$effect(() => {
    if(events) {
        let reversed = events.sort((a, b) => {
            return b.origin_server_ts - a.origin_server_ts
        })

        processed = reversed.filter((event) => {
            return event.sender != user?.userId
        })

    }
    if(events.length == 2) {
        let event_id = events[0].event_id
        console.log(event_id)
    }
})

</script>

<div class="flex flex-col overflow-x-hidden">
    {#if processed}
        {#each processed as email}
            <EmailItem {email} />
        {/each}
    {/if}
</div>

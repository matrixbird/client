<script>
import { createMatrixStore } from '$lib/store/matrix.svelte.js'
import EmailItem from './email-item.svelte'


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
})

</script>

<div class="flex flex-col overflow-x-hidden">
    {#if processed}
        {#each processed as email}
            <EmailItem {email} />
        {/each}
    {/if}
</div>

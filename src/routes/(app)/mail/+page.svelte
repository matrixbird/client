<script>
import { createAppStore } from '$lib/store/store.svelte.js'
const store = createAppStore()
const events = $derived(store?.events)

$effect(() => {
    if(events) {
    }
})

</script>

<div class="">
    inbox
</div>

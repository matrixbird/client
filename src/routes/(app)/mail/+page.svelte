<script>
import { createStore } from '$lib/store/store.svelte.js'
const store = createStore()
const events = $derived(store?.events)

$effect(() => {
    if(events) {
    }
})

</script>

<div class="">
    inbox
</div>

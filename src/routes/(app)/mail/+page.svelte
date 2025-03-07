<script>
import { createAppStore } from '$lib/store/app.svelte.js'
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

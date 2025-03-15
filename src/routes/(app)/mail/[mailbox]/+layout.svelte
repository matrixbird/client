<script>
import { page } from '$app/state';
import ListView from '$lib/list-view/list-view.svelte'

let { children } = $props();

let event_open = $derived.by(() => {
    return page.params.event !== undefined
})

import { ui_state } from '$lib/store/app.svelte.js'
let expanded = $derived(ui_state?.expanded)

</script>

<div class="grid grid-cols-[1fr] w-full h-full overflow-hidden" 
class:open={expanded || event_open}>

    <ListView />

    {#if event_open || expanded}
        <div class="overflow-hidden border-l border-border">
            {@render children()}
        </div>
    {/if}
</div>

<style>
.open {
    grid-template-columns: 45% 55%;
}
</style>



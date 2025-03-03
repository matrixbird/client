<script>
import { page } from '$app/stores';
import ListView from '$lib/list-view/list-view.svelte'

let { children } = $props();

let event_open = $derived.by(() => {
    return $page.params.event !== undefined
})

import { userState, ui_state } from '$lib/store/store.svelte.js'
let expanded = $derived(ui_state?.expanded)

</script>

<div class="grid grid-cols-[1fr] w-full h-full overflow-hidden" 
class:open={expanded}>

    {#if !event_open || expanded}
        <ListView />
    {/if}

    {#if event_open || expanded}
        <div class="overflow-hidden"
        class:border-l={expanded}
        class:border-border={expanded}>
            {@render children()}
        </div>
    {/if}
</div>

<style>
.open {
    grid-template-columns: 50% 50%;
}
</style>



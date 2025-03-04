<script>
import { page } from '$app/stores';
import ListView from '$lib/list-view/list-view.svelte'

let { children } = $props();

let event_open = $derived.by(() => {
    return $page.params.event !== undefined
})

import { ui_state } from '$lib/store/store.svelte.js'
let expanded = $derived(ui_state?.expanded)
let compact = $derived(ui_state?.compact)

</script>

<div class="grid grid-cols-[1fr] w-full h-full overflow-hidden" 
class:open={expanded || (compact && event_open)}>

    {#if !event_open || expanded || compact}
        <ListView />
    {/if}

    {#if event_open || expanded}
        <div class="overflow-hidden"
        class:border-l={expanded || compact}
        class:border-border={expanded || compact}>
            {@render children()}
        </div>
    {/if}
</div>

<style>
.open {
    grid-template-columns: 50% 50%;
}
</style>



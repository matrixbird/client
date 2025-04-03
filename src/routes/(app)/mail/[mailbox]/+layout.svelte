<script>
import { page } from '$app/state';
import ListView from '$lib/list-view/list-view.svelte'

let { children } = $props();

let event_open = $derived.by(() => {
    return page.params.event !== undefined
})

import { ui_state } from '$lib/store/app.svelte'
let expanded = $derived(ui_state?.expanded)
let mobile = $derived(ui_state?.mobile)

</script>

<div class="grid grid-cols-[1fr] w-full h-full overflow-hidden" 
class:open={(expanded || event_open) && !mobile}>

    <ListView />

    {#if event_open || expanded}
        <div class="overflow-hidden border-l border-border" 
        class:full={mobile}>
            {@render children()}
        </div>
    {/if}
</div>

<style>
.open {
    grid-template-columns: 45% 55%;
}
.full {
    background: var(--background);
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
}
</style>



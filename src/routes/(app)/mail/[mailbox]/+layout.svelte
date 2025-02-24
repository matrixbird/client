<script>
import { page } from '$app/stores';
import ListView from '$lib/list-view/list-view.svelte'

let { children } = $props();

let event_open = $derived.by(() => {
    return $page.params.event !== undefined
})

</script>

<div class="grid grid-cols-[1fr] w-full h-full overflow-hidden" 
class:open={event_open}>

    <ListView />

    {#if event_open}
        <div class="overflow-hidden border-l border-border">
            {@render children()}
        </div>
    {/if}
</div>

<style>
.open {
    grid-template-columns: 50% 50%;
}
</style>



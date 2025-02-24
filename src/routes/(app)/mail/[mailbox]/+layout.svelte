<script>
import { page } from '$app/stores';
import ListView from '$lib/list-view/list-view.svelte'

let { children } = $props();

let event_open = $derived.by(() => {
    return $page.params.event !== undefined
})

let width = $state(550);

</script>

<div class="view grid  w-full h-full overflow-hidden" 
style="--width:{width}px;">

    <ListView />

        <div class="overflow-hidden border-l border-border">
            {@render children()}
        </div>
</div>

<style>
.view {
    grid-template-columns: 50% 50%;
}
</style>



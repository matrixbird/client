<script>
import { page } from '$app/stores';
import EditorItem from './editor-item.svelte';
import { createStore } from '$lib/store/store.svelte.js'
const store = createStore()

let items = $derived.by(() => {
    return store.editor?.items
})


let active = $derived.by(() => {
    return items?.length > 0
})


</script>


{#if items && active}
<div class="editors flex gap-2">
    {#each items as item, i (item.id)}
        <EditorItem {item} index={i} />
    {/each}
</div>
{/if}

<style>
.editors {
    z-index: 100;
    bottom: 0;
    right: 3rem;
    position: fixed;
}
</style>

<script>
import { page } from '$app/stores';
import EditorItem from './editor-item.svelte';
import { createEditorStore } from '$lib/store/editor.svelte.js'
const store = createEditorStore()

let items = $derived.by(() => {
    return store.editor?.items
})


let active = $derived.by(() => {
    return items?.length > 0
})


</script>


{#if items && active}
<div class="editors flex gap-3 items-end">
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

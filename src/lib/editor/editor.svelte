<script>
import { page } from '$app/stores';
import EditorItem from './editor-item.svelte';
import { createEditorStore } from '$lib/store/editor.svelte.js'
const store = createEditorStore()

let editors = $derived.by(() => {
    return store.editor?.editors
})


let active = $derived.by(() => {
    return editors?.length > 0
})


</script>


{#if editors && active}
<div class="editors flex gap-3 items-end">
    {#each editors as editor, i (editor.id)}
        <EditorItem {editor} index={i} />
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

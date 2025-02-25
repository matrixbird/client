<script>
import { onMount, onDestroy } from 'svelte';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

let { updateComposer } = $props();

let element;
let editor;

onMount(() => {
    editor = new Editor({
        element: element,
        extensions: [StarterKit],
        content: ``,
        onTransaction: () => {
            // force re-render so `editor.isActive` works as expected
            editor = editor;
            let data = {
                html: editor.getHTML(),
                //json: editor.getJSON(),
                text: editor.getText(),
            }
            updateComposer(data);
        },
    });
});

onDestroy(() => {
    if (editor) {
        editor.destroy();
    }
});

export function focus() {
    editor.commands.focus();
}
</script>

<div class="composer p-2" 
    onclick={focus}
    bind:this={element}></div>

<style>
.composer {
    overflow: auto;
    max-height: 60dvh;
    height: 100%;
    cursor: text;
    outline: none;
}
</style>


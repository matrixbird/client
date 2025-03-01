<script>
import { onMount, onDestroy } from 'svelte';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

let { updateComposer, isReply } = $props();

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

<div class="composer px-4" 
    class:pt-4={!isReply}
    class:mr-1={isReply}
    class:mxh={isReply}
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
.mxh {
    max-height: 35dvh;
}
</style>


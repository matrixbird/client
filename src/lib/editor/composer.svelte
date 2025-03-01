<script>
import { onMount, onDestroy } from 'svelte';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

let { 
    state,
    updateComposer, 
    isReply
} = $props();

let element;
let editor;

let content = $derived.by(() => {
    return state?.html
})

let caret = $derived.by(() => {
    return state?.selection
})

onMount(() => {
    editor = new Editor({
        element: element,
        extensions: [StarterKit],
        content: content ? content : '',
        onTransaction: ({ editor }) => {
            editor = editor;
            let data = {
                html: editor.getHTML(),
                json: editor.getJSON(),
                text: editor.getText(),
                selection: editor.state.selection.anchor,
            }
            updateComposer(data);
        },
        onCreate: ({ editor }) => {
        }
    });
    if(state) {
        editor.chain().focus().setTextSelection(caret).run()
    }
    element.scrollIntoView({ block: "start", inline: "nearest"
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
    max-height: 30dvh;
}
</style>


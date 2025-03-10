<script>
import { onMount, onDestroy } from 'svelte';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import { ui_state } from '$lib/store/app.svelte.js'

let expanded = $derived(ui_state?.expanded)


let { 
    state,
    updateComposer, 
    composer_focus,
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
        },
        onFocus({ editor, event }) {
            if(!isReply) {
                composer_focus(true);
            }
        },
        onBlur({ editor, event }) {
            if(!isReply) {
                composer_focus(false);
            }
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
    class:max-h-[50dvh]={!isReply}
    class:max-h-[30dvh]={isReply && expanded}
    class:max-h-[10dvh]={isReply && !expanded}
    onclick={focus}
    bind:this={element}></div>

<style lang="postcss">
@reference "tailwindcss/theme";

.composer {
    overflow: auto;
    height: 100%;
    cursor: text;
    outline: none;
}
</style>


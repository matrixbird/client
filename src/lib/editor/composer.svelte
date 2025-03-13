<script>
import { onMount, onDestroy } from 'svelte';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import { ui_state } from '$lib/store/app.svelte.js'

let expanded = $derived(ui_state?.expanded)


let { 
    state,
    updateComposer, 
    updateScroll,
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

    window.addEventListener('keydown', handleScrollDown);
});

function handleScrollDown(event) {
    if (editor.isFocused && event.key === 'Enter' && isReply) {
        //event.preventDefault();
        updateScroll();
    }
}

onDestroy(() => {
    if (editor) {
        editor.destroy();
    }
    window.removeEventListener('keydown', handleScrollDown);
});

export function focus() {
    editor.commands.focus();
}

export function insert(data) {
    editor.chain().focus().insertContent(data).run();
    focus();
}
</script>

<div class="composer px-4 max-h-[50dvh] overflow-auto" 
    class:pt-4={!isReply}
    class:mr-1={isReply}
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


<script>
import { plus } from '$lib/assets/icons.js'
import { createEditorStore } from '$lib/store/editor.svelte.js'
const store = createEditorStore()

import { ui_state } from '$lib/store/store.svelte.js'
let expanded = $derived(ui_state?.expanded)
let compact = $derived(ui_state?.compact)

function newMessage() {
    store.newEditor()
}

</script>

<button 
    onclick={newMessage}
    class="flex place-items-center py-2 px-3 min-w-[200px]"
    class:w-full={expanded || compact}>
    <div class="ml-5">
        {@html plus}
    </div>
    <div class="ml-2">
        New message
    </div>
</button>

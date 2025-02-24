<script>
import { plus } from '$lib/assets/icons.js'
import { createEditorStore } from '$lib/store/editor.svelte.js'
const store = createEditorStore()

function newMessage() {
    store.newEditor()
}

</script>

<button 
    onclick={newMessage}
    class="flex place-items-center py-2 px-3 w-full">
    <div class="ml-5">
        {@html plus}
    </div>
    <div class="ml-2">
        New message
    </div>
</button>

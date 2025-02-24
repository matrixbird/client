<script>
import { plus } from '$lib/assets/icons.js'
import { createStore } from '$lib/store/store.svelte.js'
const store = createStore()

function newMessage() {
    store.editor.active = true
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

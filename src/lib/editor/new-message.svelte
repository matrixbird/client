<script>
import { plus } from '$lib/assets/icons.js'
import { createEditorStore } from '$lib/store/editor.svelte.js'
const store = createEditorStore()

import { ui_state } from '$lib/store/store.svelte.js'
let expanded = $derived(ui_state?.expanded)
let compact = $derived(ui_state?.compact)
let minimized = $derived(!expanded && !compact)

function newMessage() {
    store.create()
}

</script>

    <button 
        onclick={newMessage}
        class="flex justify-center items-center py-2 px-3 w-full"
        class:text-md={!minimized}>

        <div class="flex">
            <div class="">
                {@html plus}
            </div>
            <div class="ml-2" 
            class:mr-1={minimized}
            class:mr-5={!minimized}>
                Compose
            </div>
        </div>

    </button>


<style lang="postcss">

button {
}

</style>

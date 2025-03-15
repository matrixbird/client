<script>
import { plus } from '$lib/assets/icons.js'
import { createEditorStore } from '$lib/store/editor.svelte'
const store = createEditorStore()

import { ui_state } from '$lib/store/app.svelte.js'
let expanded = $derived(ui_state?.expanded)

function newMessage() {
    store.create()
}

</script>

    <button 
        onclick={newMessage}
        class="primary flex justify-center items-center py-2 px-3 w-full"
        class:text-md={expanded}
        class:rounded={!expanded}>

        <div class="flex">
            <div class="">
                {@html plus}
            </div>
            <div class="ml-2" 
            class:mr-1={!expanded}
            class:mr-5={expanded}>
                Compose
            </div>
        </div>

    </button>


<style lang="postcss">

button {
    border-radius: 500px;
}

</style>

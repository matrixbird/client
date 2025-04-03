<script>
import { plus } from '$lib/assets/icons'
import { createEditorStore } from '$lib/store/editor.svelte'
const store = createEditorStore()

import { ui_state } from '$lib/store/app.svelte'
let expanded = $derived(ui_state?.expanded)

function newMessage() {
    store.create()
}

</script>

<div class="new-message">

    <button 
        onclick={newMessage}
        class="primary flex justify-center items-center py-3 px-3 w-full">

        <div class="flex">
            <div class="">
                {@html plus}
            </div>
            <div class="mx-2">
                Compose
            </div>
        </div>

    </button>
</div>


<style lang="postcss">

.new-message {
    position: fixed;
    z-index: 100;
    bottom: 2rem;
    right: 1.5rem;
}

</style>

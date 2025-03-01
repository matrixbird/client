<script>
import { page } from '$app/stores';
import { expand, collapse } from '$lib/assets/icons.js'
import { tooltip } from '$lib/components/tooltip/tooltip'

import { ui_state } from '$lib/store/store.svelte.js'

let expanded = $derived(ui_state?.expanded)

function toggleExpand() {
    if(expanded) {
        ui_state.expanded = false
    } else {
        ui_state.expanded = true
    }

    if(expanded) {
        localStorage.setItem('expanded', 'true')
    } else {
        localStorage.removeItem('expanded')
    }
}

let opts = {
    text: expanded ? "Minimize" : "Maximize",
    placement: "right"
}

</script>

<div class="flex bg-bird-900 p-1 text-white font-medium"
ondblclick={toggleExpand}>

    <div class="flex place-items-center silk cursor-pointer text ml-1 tracking-wide
">
        matrixbird
    </div>

    <div class="flex-1 flex place-items-center ml-3">
    </div>
    <div class="cursor-pointer flex place-items-center mr-1"
    onclick={toggleExpand}
    use:tooltip={opts}>

        {#if expanded}
            {@html collapse}
        {:else}
            {@html expand}
        {/if}
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
</style>


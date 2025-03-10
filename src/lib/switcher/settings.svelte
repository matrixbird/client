<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { tooltip } from '$lib/components/tooltip/tooltip'

import { 
    settings
} from '$lib/assets/icons'


import { ui_state } from '$lib/store/app.svelte.js'
let expanded = $derived(ui_state?.expanded)

function open() {
    if(!active) {
        //goto(`/chat`)
    }
}

let active = $derived.by(() => {
    return $page.route.id.startsWith(`/(app)/chat`)
})

let opts = {
    text: "Settings",
    placement: "right",
}

</script>

<div class="grid place-items-center cursor-pointer mx-1"
onclick={open} use:tooltip={opts}>

    <div class="icon rounded p-1 h-8 w-8 hover:bg-bird-400" 
        class:active={active}>
        {@html settings}
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
.active {
    background-color: theme('colors.bird.200');
}
.active:hover {
    background-color: theme('colors.bird.200');
}
</style>

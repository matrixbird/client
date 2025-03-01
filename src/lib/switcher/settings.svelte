<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { tooltip } from '$lib/components/tooltip/tooltip'

import { 
    settings
} from '$lib/assets/icons'


import { ui_state } from '$lib/store/store.svelte.js'
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
    text: "Settings"
}

</script>

<div class="grid place-items-center cursor-pointer mx-1"
onclick={open} use:tooltip={opts}>

    <div class="icon p-1 rounded" class:active={active}>
        {@html settings}
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
.active {
    fill: white;
    background-color: theme('colors.bird.200');
}
.icon {
    fill: theme('colors.bird.700');
}
.icon:hover {
    background-color: theme('colors.bird.100');
}
.active:hover {
    background-color: theme('colors.bird.200');
}
</style>

<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';

import { tooltip } from '$lib/components/tooltip/tooltip'

import { route_state } from '$lib/store/store.svelte.js'

import { 
    envelope_outline, 
    envelope_solid,
} from '$lib/assets/icons'

function open() {
    if(!active) {

        if(route_state.mail != null) {
            goto(route_state.mail)
            return
        }

        goto(`/mail/inbox`)
    }
}

let active = $derived.by(() => {
    return $page.route.id.startsWith(`/(app)/mail`)
})

let opts = {
    text: "Mail"
}

</script>

<div class="grid place-items-center cursor-pointer mx-1"
onclick={open} use:tooltip={opts}>

    <div class="icon p-1 rounded" class:active={active}>
        {@html envelope_solid}
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

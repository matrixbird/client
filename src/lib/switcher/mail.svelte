<script>
import { page } from '$app/state';
import { goto } from '$app/navigation';

import { tooltip } from '$lib/components/tooltip/tooltip'

import { route_state } from '$lib/store/app.svelte.js'

let {expanded} = $props();

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
    return page.params.mailbox == `inbox`
})

let opts = {
    text: "Mail",
    placement: "right",
}

</script>

<div class="grid place-items-center cursor-pointer"
onclick={open} use:tooltip={opts}>

    <div class="icon rounded p-1 h-8 w-8 hover:bg-bird-400" 
        class:active={active}
        class:icon-active={active}>
        {@html envelope_solid}
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

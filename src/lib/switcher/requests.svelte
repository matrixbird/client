<script>
import { page } from '$app/state';
import { goto } from '$app/navigation';

import { tooltip } from '$lib/components/tooltip/tooltip'

import { route_state } from '$lib/store/app.svelte'

let {expanded} = $props();

import { createMatrixStore } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

let requests = $derived(store.requests)

let count = $derived(requests?.length)

import { 
    inbox_arrow,
} from '$lib/assets/icons'

function open() {
    if(!active) {
        goto(`/mail/requests`)
    }
}

let active = $derived.by(() => {
    return page.params.mailbox == `requests`
})

let text = count == 1 ? `email request` : `email requests`

let opts = {
    text: `${count} ${text}`,
    placement: "right",
}

</script>

<div class="grid place-items-center cursor-pointer mb-2 relative"
    class:mt-2={expanded}
onclick={open} use:tooltip={opts}>

    <div class="icon rounded p-1 h-8 w-8 " 
        class:active={active}
        class:icon-active={active}>
        {@html inbox_arrow}
    </div>

    <div class="flex place-items-center absolute top-[-10px] right-[9px] bg-red-700 rounded 
        rounded-[50%] h-5 w-5 text-white">
        <div class="w-full text-center font-bold text-xs">
        {count}
        </div>
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

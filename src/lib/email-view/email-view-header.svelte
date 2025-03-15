<script>
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { close } from '$lib/assets/icons.js'

let {
    thread_event
} = $props();

import { 
    route_state,
} from '$lib/store/app.svelte.js'

let mailbox = $derived.by(() => {
    return page.params.mailbox
})

function killEmailItemView() {
    route_state[mailbox] = null
    goto(`/mail/${mailbox}`)
}

let subject = $derived(thread_event?.content?.subject || `(no subject)`)
</script>

<div class="flex border-b border-border py-1 pl-4 pr-3 min-h-[2.5rem]">
    <div class="flex flex-1 place-items-center select-text">
        <span class="font-medium text-lg">{subject}</span>
    </div>

    <div class="place-items-center">
    </div>

    <div class="flex place-items-center cursor-pointer" 
    onclick={killEmailItemView}>
        {@html close}
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
</style>


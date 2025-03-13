<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { close } from '$lib/assets/icons.js'

let {
    thread_event
} = $props();

function killEmailItemView() {
    let mailbox = $page.params.mailbox
    goto(`/mail/${mailbox}`)
}

let subject = $derived(thread_event?.content?.subject || `(no subject)`)
</script>

<div class="flex border-b border-border py-1 pl-4 pr-3">
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


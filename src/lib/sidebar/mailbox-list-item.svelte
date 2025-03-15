<script>
import { page } from '$app/state';
import { goto } from '$app/navigation';

import { createMatrixStore } from '$lib/store/matrix.svelte'
import { count } from '$lib/store/app.svelte'

const store = createMatrixStore()
const events = $derived(store?.events)

let inbox_count = $derived.by(() => {
    return count?.inbox
})

import { 
    route_state,
} from '$lib/store/app.svelte'


let { mailbox } = $props();

function open() {
    let route_exists = route_state[mailbox.path]
    if(route_exists) {
        goto(route_state[mailbox.path])
        return
    }

    goto(`/mail/${mailbox.path}`)
}

let active = $derived.by(() => {
    return page.params.mailbox === mailbox.path
})

let is_inbox = $derived.by(() => {
    return mailbox.path === 'inbox'
})


</script>

<div class="flex place-items-center mt-1 
    hover:bg-bird-100 py-1 
    cursor-pointer"
    class:font-semibold={active}
    class:bg-bird-100={active}
onclick={open}>

    <div class="pl-1 pr-2 flex place-items-center"
    class:opacity-70={!active}>
        {@html mailbox.icon}
    </div>

    <div class="text-sm flex-1">
        {mailbox.name}
    </div>
    {#if is_inbox}
        <div class="mx-2 text-xs flex place-items-center">
            {inbox_count}
        </div>
    {/if}
</div>

<style>
</style>

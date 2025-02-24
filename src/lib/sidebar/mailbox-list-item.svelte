<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';

import { createStore } from '$lib/store/store.svelte.js'

const store = createStore()
const events = $derived(store?.events)

let count = $derived.by(() => {
    return events.length
})

let { mailbox } = $props();

function open() {
    console.log('open mailbox', mailbox)
    goto(`/mail/${mailbox.path}`)
}

let active = $derived.by(() => {
    return $page.params.mailbox === mailbox.path
})

let is_inbox = $derived.by(() => {
    return mailbox.path === 'inbox'
})


</script>

<div class="flex place-items-center mt-1 
    hover:bg-neutral-100 p-1 
    cursor-pointer"
    class:font-semibold={active}
    class:bg-neutral-100={active}
onclick={open}>

    <div class="px-2 flex place-items-center"
    class:opacity-70={!active}>
        {@html mailbox.icon}
    </div>

    <div class="text-sm flex-1">
        {mailbox.name}
    </div>
    {#if is_inbox}
        <div class="mx-2 text-xs flex place-items-center">
            {count}
        </div>
    {/if}
</div>

<style>
</style>

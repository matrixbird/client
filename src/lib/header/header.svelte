<script>
import { page } from '$app/stores';
import { expand, collapse, inbox } from '$lib/assets/icons.js'
import { tooltip } from '$lib/components/tooltip/tooltip'

import { ui_state } from '$lib/store/store.svelte.js'

let { dragging, dragStart, dragEnd } = $props();

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


let placement = $derived.by(() => {
    return expanded ? "bottom" : "top-end"
})

let offset = $derived.by(() => {
    return expanded ? [10, -34] : [20, 4]
})

let opts = $derived.by(() => {
    return {
        text: expanded ? "Minimize" : "Maximize",
        placement: placement,
        classes: 'silk',
        offset: offset,
    }
})

let mousedown = $state(false);

function start() {
    mousedown = true
    dragStart()
}

function end() {
    mousedown = false
    dragEnd()
}

let mailbox = $derived.by(() => {
    return $page.params.mailbox
})

let mailbox_title = $derived.by(() => {
    if(mailbox == "inbox") {
        return "Inbox"
    } else if(mailbox == "sent") {
        return "Sent Mail"
    } else if(mailbox == "drafts") {
        return "Drafts"
    }
})

let title = $derived.by(() => {
    if(expanded) {
        return `matrixbird`
    }
    return mailbox_title
})

</script>

<div class="flex bg-bird-900 text-white font-medium"
    class:p-1={expanded}
ondblclick={toggleExpand}>

    {#if !expanded}
        <div class="flex place-items-center mx-2 py-1">
            {@html inbox}
        </div>
    {/if}

    <div class="flex place-items-center silk cursor-pointer tracking-wide
" class:ml-1={expanded}>
        {title}
    </div>

    <div class="flex-1 flex place-items-center ml-3"
        onmousedown={start}
        onmouseup={end}
    class:cursor-grab={!expanded}
    class:cursor-grabbing={dragging || mousedown}>

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


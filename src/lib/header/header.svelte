<script>
import { page } from '$app/stores';
import { expand_vertical, collapse, inbox, fullscreen } from '$lib/assets/icons.js'
import { tooltip } from '$lib/components/tooltip/tooltip'

import { ui_state } from '$lib/store/store.svelte.js'

let { dragging, dragStart, dragEnd } = $props();

let expanded = $derived(ui_state?.expanded)
let compact = $derived(ui_state?.compact)

function toggleExpand() {

    if(!compact && !expanded) {
        ui_state.compact = true
        localStorage.setItem('compact', 'true')
        localStorage.removeItem('expanded')
        return
    }

    if(compact && !expanded) {
        ui_state.compact = false
        ui_state.expanded = true
        localStorage.removeItem('compact')
        localStorage.setItem('expanded', 'true')
        return
    }

    if(expanded) {
        ui_state.expanded = false
        localStorage.removeItem('expanded')
        localStorage.removeItem('compact')
        return
    }
}


let placement = $derived.by(() => {
    return expanded ? "bottom" : "top-end"
})

let offset = $derived.by(() => {
    return expanded ? [10, -34] : [20, 4]
})

let text = $derived.by(() => {
    if(expanded) {
        return "Minimize"
    }
    if(compact) {
        return "Maximize"
    }
    return "Expand"
})

let opts = $derived.by(() => {
    return {
        text: text,
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
    if(expanded || compact) {
        return `matrixbird`
    }
    return mailbox_title
})

</script>

<div class="flex bg-bird-900 text-white font-medium"
    class:p-1={expanded}
ondblclick={toggleExpand}>

    {#if !expanded && !compact}
        <div class="flex place-items-center mx-2 py-1">
            {@html inbox}
        </div>
    {/if}

    <div class="flex place-items-center silk cursor-pointer text-sm py-1" 
        class:ml-2={compact}
        class:ml-1={expanded}>
        {title}
    </div>

    <div class="flex-1 flex place-items-center ml-3"
        onmousedown={start}
        onmouseup={end}
    class:cursor-grab={!expanded}
    class:cursor-grabbing={(dragging || mousedown) && !expanded}>

    </div>

    <div class="cursor-pointer flex place-items-center mr-1"
    onclick={toggleExpand}
    use:tooltip={opts}>

        {#if expanded}
            {@html collapse}
        {:else if compact}
            {@html fullscreen}
        {:else}
            {@html expand_vertical}
        {/if}
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
</style>


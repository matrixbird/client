<script>
import { page } from '$app/state';
import { expand, circle, collapse, inbox, fullscreen } from '$lib/assets/icons.js'
import { tooltip } from '$lib/components/tooltip/tooltip'

import Mailbox from './mailbox.svelte'

import { ui_state } from '$lib/store/app.svelte.js'

let sidebar_hidden = $derived(ui_state?.sidebar_hidden)

let { dragging, dragStart, dragEnd } = $props();

let expanded = $derived(ui_state?.expanded)

function cycle() {
    if(expanded) {
        ui_state.expanded = false
        localStorage.removeItem('expanded')
        return
    }

    if(!expanded) {
        ui_state.expanded = true
        localStorage.setItem('expanded', 'true')
        return
    }

}

function minimize(e) {
    e.stopPropagation()
    ui_state.expanded = false
    localStorage.removeItem('expanded')
}

function maximize(e) {
    e.stopPropagation()
    ui_state.expanded = true
    localStorage.setItem('expanded', 'true')
}


let placement = $derived.by(() => {
    return expanded ? "bottom" : "top-end"
})

let offset = $derived.by(() => {
    return expanded ? [10, -34] : [20, 4]
})

let opts_min = $derived.by(() => {
    return {
        disabled: !expanded,
        text: "Minimize",
        placement: placement,
        classes: 'silk',
        offset: offset,
    }
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
    return page.params.mailbox
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

</script>

<div class="flex bg-bird-900 pr-2 text-white font-medium h-8"
        class:rounded-t-2xl={!expanded}
ondblclick={cycle}>

    {#if !expanded && sidebar_hidden}
        <Mailbox />
    {/if}

    {#if expanded || !sidebar_hidden}
        <div class="flex place-items-center silk cursor-pointer text-sm " 
            class:py-1={expanded}
            class:ml-2={expanded}
            class:ml-3={!expanded && !sidebar_hidden}>
            matrixbird
        </div>
    {/if}

    <div class="flex-1 flex place-items-center ml-3"
        onmousedown={start}
        onmouseup={end}
    class:cursor-grab={!expanded}
    class:cursor-grabbing={(dragging || mousedown) && !expanded}>

    </div>

    <div class="flex place-items-center mr-1 cursor-pointer"
    onclick={cycle}
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


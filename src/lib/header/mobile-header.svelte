<script>
import { page } from '$app/state';
import { expand, menu, circle, collapse, inbox, fullscreen } from '$lib/assets/icons'
import { tooltip } from '$lib/components/tooltip/tooltip'

import Profile from '$lib/profile/profile.svelte';

import Search from '$lib/search/search.svelte';

import Mailbox from './mailbox.svelte'

import { 
    ui_state, 
    toggleMobileSidebar,
    toggleExpand 
} from '$lib/store/app.svelte'

let sidebar_hidden = $derived(ui_state?.sidebar_hidden)

let { dragging, dragStart, dragEnd } = $props();

let expanded = $derived(ui_state?.expanded)
let mobile = $derived(ui_state?.mobile)

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

function toggleSidebar() {
    toggleMobileSidebar()
}

</script>

<div class="mx-1 my-2 flex pr-2 font-medium h-12 border-3 border-bird-200 rounded-[500px]"
ondblclick={toggleExpand}>

    <div class="flex place-items-center px-3 cursor-pointer"
    onclick={toggleSidebar}>
        {@html menu}
    </div>


    <div class="flex place-items-center flex-1">
        <Search />
    </div>

    <div class="flex place-items-center">
        <Profile />
    </div>


</div>

<style lang="postcss">
@reference "tailwindcss/theme";
</style>


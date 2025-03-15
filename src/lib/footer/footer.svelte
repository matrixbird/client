<script>
import { tooltip } from '$lib/components/tooltip/tooltip'
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import { 
    cloud,
    cloud_off,
    show_sidebar,
    hide_sidebar
} from '$lib/assets/icons.js'

import { app, ui_state, toggleSidebar } from '$lib/store/app.svelte'

let expanded = $derived(ui_state?.expanded)

let app_status = $derived(app?.status)

let sidebar_hidden = $derived(ui_state?.sidebar_hidden)

import { sync_state } from '$lib/store/matrix.svelte'

let connected = $derived.by(() => {
    return sync_state.state == "PREPARED" || sync_state.state == "SYNCING"
})

let disconnected = $derived.by(() => {
    return sync_state.state == "ERROR" || sync_state.state == "RECONNECTING"
})

let reconnecting = $derived.by(() => {
    return sync_state.state == "RECONNECTING"
})

let syncing = $derived.by(() => {
    return sync_state.state == "SYNCING"
})

let status = $derived.by(() => {
    if(sync_state.state == "PREPARED" || sync_state.state == "SYNCING") {
        return "Connected"
    } else if(sync_state.state == "RECONNECTING") {
        return "Trying to reconnect..."
    } else if(sync_state.state == "ERROR") {
        return "Disconnected"
    }
    return sync_state.state
})

let last_sync = $derived.by(() => {
    return dayjs(sync_state.last_sync).fromNow()
})

let last_retry = $derived.by(() => {
    return dayjs(sync_state.last_retry).fromNow()
})

let hovered = $state(false);


let text = $derived.by(() => {
    if(connected) {
        return `${status} - Last sync: ${last_sync}`
    }
    if(disconnected) {
        return `${status} - Last retry: ${last_retry}`
    }
    return status
})

let opts = $derived.by(() => {
    return {
        text: sidebar_hidden ? "Show sidebar" : "Hide sidebar",
        placement: 'top-start',
        classes: 'p-4',
        offset: [10, 6]
    }
})

let sync_opts = $derived.by(() => {
    return {
        text: text,
        placement: 'top-start',
        theme: "dark",
        classes: 'p-4',
        offset: [10, 6]
    }
})

</script>

<div class="flex border-t border-border rounded-b-2xl">

    {#if !expanded}
    <div class="ml-2 flex place-items-center px-2 py-1 cursor-pointer"
        use:tooltip={opts} onclick={toggleSidebar}>
        {#if sidebar_hidden}
            {@html show_sidebar}
        {:else}
            {@html hide_sidebar}
        {/if}
    </div>
    {/if}



    <div class="flex place-items-center px-2 py-1 cursor-pointer"
        use:tooltip={sync_opts}>
        {#if connected}
            {@html cloud}
        {:else }
            {@html cloud_off}
        {/if}
    </div>



    <div class="status flex place-items-center text-sm ml-2">
        {app_status}
    </div>


</div>

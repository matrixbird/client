<script>
import { tooltip } from '$lib/components/tooltip/tooltip'
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

import { 
    cloud,
    cloud_off
} from '$lib/assets/icons.js'

import { sync } from '$lib/store/matrix.svelte.js'

let connected = $derived.by(() => {
    return sync.state == "PREPARED" || sync.state == "SYNCING"
})

let disconnected = $derived.by(() => {
    return sync.state == "ERROR" || sync.state == "RECONNECTING"
})

let reconnecting = $derived.by(() => {
    return sync.state == "RECONNECTING"
})

let syncing = $derived.by(() => {
    return sync.state == "SYNCING"
})

let status = $derived.by(() => {
    if(sync.state == "PREPARED" || sync.state == "SYNCING") {
        return "Connected"
    } else if(sync.state == "RECONNECTING") {
        return "Trying to reconnect..."
    } else if(sync.state == "ERROR") {
        return "Disconnected"
    }
    return sync.state
})

let last_sync = $derived.by(() => {
    return dayjs(sync.last_sync).fromNow()
})

let last_retry = $derived.by(() => {
    return dayjs(sync.last_retry).fromNow()
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
        text: text,
        placement: 'top-start',
        theme: "dark",
    }
})

</script>

<div class="flex border-t border-border px-2 py-1 cursor-pointer">

    <div class="flex place-items-center mx-2"
        use:tooltip={opts}>
        {#if connected}
            {@html cloud}
        {:else }
            {@html cloud_off}
        {/if}
    </div>



    {#if hovered && connected && last_sync}
        <div class="flex place-items-center text-xs leading-5">
            Last sync: {last_sync} ({sync.last_sync})
        </div>
    {/if}

    {#if hovered && disconnected && last_retry}
        <div class="flex place-items-center text-xs leading-5">
            Last retry: {last_retry} ({sync.last_retry})
        </div>
    {/if}


</div>

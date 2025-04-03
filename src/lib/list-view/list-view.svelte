<script>
import ListHeader from './list-header.svelte'
import EmailItems from './email-items.svelte'
import EmailRequests from './email-requests.svelte';

import { page } from '$app/state';

import { ui_state } from '$lib/store/app.svelte'
let mobile = $derived(ui_state?.mobile)

let is_email_requests = $derived.by(() => {
    return page.params.mailbox == "requests";
})

</script>

<div class="grid grid-rows-[2.5rem_1fr] overflow-hidden"
    class:mobile={mobile}>

    {#if !mobile}
        <ListHeader />
    {/if}

    <div class="items h-full overflow-y-auto overflow-x-hidden">

        {#if is_email_requests}
            <EmailRequests />
        {:else}
            <EmailItems />
        {/if}

    </div>
</div>

<style>
.mobile {
    grid-template-rows: 1fr;
}
</style>

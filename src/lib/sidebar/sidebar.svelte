<script>
import MailboxList from './mailbox-list.svelte'
import NewMessage from '$lib/editor/new-message.svelte'
import EmailRequests from './email-requests.svelte';

import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

let requests = $derived(store.requests)
</script>

<div class="flex flex-col w-full  p-2">


    <div class="flex place-items-center mb-2">
        <NewMessage />
    </div>

    {#if requests.length > 0}
        <EmailRequests />
    {/if}

    <MailboxList />

</div>

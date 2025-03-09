<script>
import MailboxList from './mailbox-list.svelte'
import NewMessage from '$lib/editor/new-message.svelte'
import EmailRequests from './email-requests.svelte';

import { email_requests } from '$lib/store/matrix.svelte.js'
</script>

<div class="flex flex-col w-full  p-2">


    <div class="flex place-items-center mb-2">
        <NewMessage />
    </div>

    {#if email_requests.length > 0}
        <EmailRequests />
    {/if}

    <MailboxList />

</div>

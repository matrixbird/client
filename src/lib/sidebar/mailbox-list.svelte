<script>
import MailboxListItem from './mailbox-list-item.svelte'

import { inbox, sent, drafts } from '$lib/assets/icons'

let mailboxes = [
    {
        name: 'Inbox',
        path: 'inbox',
        icon: inbox,
    },
    {
        name: 'Sent',
        path: 'sent',
        icon: sent,
    },
    {
        name: 'Drafts',
        path: 'drafts',
        icon: drafts,
    }
]
</script>

<div class="mt-2">

    {#each mailboxes as mailbox}
        <MailboxListItem {mailbox} />
    {/each}
</div>


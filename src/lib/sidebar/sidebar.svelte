<script>
import MailboxList from './mailbox-list.svelte'
import NewMessage from '$lib/editor/new-message.svelte'
import { plus } from '$lib/assets/icons.js'

</script>

<div class="flex flex-col w-full  p-2">


    <div class="flex place-items-center">
        <NewMessage />
    </div>

    <MailboxList />

</div>

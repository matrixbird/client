<script>
import MailboxList from './mailbox-list.svelte'
import { plus } from '$lib/assets/icons.js'

</script>

<div class="flex flex-col w-full  p-2">


    <div class="flex place-items-center">
        <button class="flex place-items-center py-2 px-3 w-full">
            <div class="ml-5">
                {@html plus}
            </div>
            <div class="ml-2">
                New message
            </div>
        </button>
    </div>

    <MailboxList />

</div>

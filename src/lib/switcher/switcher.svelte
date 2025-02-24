<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import User from '$lib/user/user.svelte'
import { 
    settings
} from '$lib/assets/icons'

import Inbox from './inbox.svelte'
import Chat from './chat.svelte'
import Calendar from './calendar.svelte'

</script>

<div class="flex flex-col border-r border-border pt-2 gap-2">

    <User />

    <Inbox />

    <Chat />

    <Calendar />

    <div class="flex-1 grid place-items-center">
    </div>

    <div class="grid place-items-center mb-4 cursor-pointer">
        <div class="p-2 hover:bg-neutral-200 rounded">
            {@html settings}
        </div>
    </div>


</div>

<style>
</style>

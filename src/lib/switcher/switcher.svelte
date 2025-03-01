<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import Profile from '$lib/profile/profile.svelte'
import { 
    settings
} from '$lib/assets/icons'

import Mail from './mail.svelte'
import Chat from './chat.svelte'
//import Calendar from './calendar.svelte'

import { ui_state } from '$lib/store/store.svelte.js'
let expanded = $derived(ui_state?.expanded)

</script>

<div class="flex flex-col border-r border-border pt-3 gap-2">

    {#if expanded}
        <Profile />
    {/if}

    <Mail />

    <Chat />

    <div class="flex-1 grid place-items-center">
    </div>

    <div class="grid place-items-center mb-4 cursor-pointer">
        <div class="p-2 hover:bg-bird-200 rounded">
            {@html settings}
        </div>
    </div>


</div>

<style>
</style>

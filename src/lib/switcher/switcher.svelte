<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import Profile from '$lib/profile/profile.svelte'

import { ui_state } from '$lib/store/store.svelte.js'

let expanded = $derived(ui_state?.expanded)

import { 
    settings
} from '$lib/assets/icons'

import Mail from './mail.svelte'
import Chat from './chat.svelte'

import Settings from './settings.svelte'


</script>

<div class="flex flex-col py-3 gap-2"
class:gap-3={!expanded}
class:border-r={expanded}
class:border-border={expanded}
class:float={!expanded}>

    {#if expanded}
        <Profile />
    {/if}

    <Mail {expanded} />

    <Chat {expanded} />

    <div class="flex-1 grid place-items-center">
    </div>

    <Settings />

</div>

<style>
.float {
    position: fixed;
    top: 5rem;
    bottom: 2rem;
    left: 1rem;
    z-index: 1;
}
</style>

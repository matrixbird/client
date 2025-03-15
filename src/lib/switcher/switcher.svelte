<script>
import { page } from '$app/state';
import { goto } from '$app/navigation';
import Profile from '$lib/profile/profile.svelte'

import { ui_state } from '$lib/store/app.svelte'

import { createMatrixStore } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

let requests = $derived(store.requests)

let expanded = $derived(ui_state?.expanded)

import { 
    settings
} from '$lib/assets/icons'

import Requests from './requests.svelte';

import Mail from './mail.svelte'
import Chat from './chat.svelte'
import Video from './video.svelte'

import Settings from './settings.svelte'


let show_requests = $derived.by(() => {
    return requests?.length > 0
})


</script>

<div class="flex flex-col py-3 gap-2"
class:gap-3={!expanded}
class:border-r={expanded}
class:border-border={expanded}
class:float={!expanded}>

    {#if expanded}
        <Profile />
    {/if}

    {#if show_requests}
        <Requests {expanded} />
    {/if}

    <Mail {expanded} />

    <Chat {expanded} disabled={true} />

    <Video {expanded} disabled={true} />

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

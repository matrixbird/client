<script>
import { createMatrixStore } from '$lib/store/matrix.svelte'

import Popup from '$lib/components/popup/popup.svelte'
import Menu from './menu.svelte'

const store = createMatrixStore()

import {
    getThumbnail,
} from '$lib/matrix/api'

import { ui_state } from '$lib/store/app.svelte'
let expanded = $derived(ui_state?.expanded)

let user = $derived.by(() => {
    if(!store?.synced) return null
    let user = store.client.store.getUser(store.client.getUserId())
    if(user) {
        return user
    }
})

let local_part = $derived.by(() => {
    if(!store?.synced) return null
    let localPart = store.client.getUserIdLocalpart()
    if(localPart) {
        return localPart
    }
})

let displayName = $derived.by(() => {
    if (user?.displayName) {
        return user?.displayName
    }
})

let initials = $derived.by(() => {
    if(displayName) {
        return displayName[0]
    }
    if(local_part) {
        return local_part[0]
    }
})

let avatar = $derived.by(() => {
    if (user?.avatarUrl) {
        return user?.avatarUrl
    }
})

$effect(() => {
    if(avatar) {
        getAvatar()
    }
})

let url = $state(null);

async function getAvatar() {
    let con = await getThumbnail(store.session.access_token, avatar)
    if(con) {
        url = con
    }
}


let popup;

function kill() {
    popup.kill()
}

let popup_active = $state(false);

function toggle(status) {
    popup_active = status
}

let placement = $derived.by(() => {
    if(expanded) return 'right-start'
    return 'right-start'
})

let mask = $derived.by(() => {
    //if(expanded) return true
    return false
})


let offset = $derived.by(() => {
    if(expanded) return [-6, 6]
    return [0, 20]
})

let opts = $derived.by(() => {
    return {
        mask: mask,
        placement: placement,
        offsetDistance: offset,
    }
})

</script>

<Popup bind:this={popup} {opts}
    {trigger} {content} {toggle}>

</Popup>

{#snippet content()}
    <Menu {kill} />
{/snippet}

{#snippet trigger()}
<div class="grid place-items-center w-full select-none">
    <div class="user rounded-[50%] cursor-pointer
        hover:bg-bird-800 grid place-items-center 
        bg-bird-900" 
    class:mb-2={expanded}
    class:active={popup_active}
    class:w-10={!expanded}
    class:h-10={!expanded}
    class:w-8={expanded}
    class:h-8={expanded}>
        <div class="font-semibold text-md text-white uppercase"
            class:text-xs={expanded}>
            {#if !avatar}
                {initials} 
            {/if}
            {#if avatar && url}
                <img src={url} class="" />
            {/if}
        </div>
    </div>
</div>
{/snippet}

<style lang="postcss">
@reference "tailwindcss/theme";
.active {
    outline: 4px solid theme('colors.bird.300');
}

img {
    border-radius: 50%;
}
</style>

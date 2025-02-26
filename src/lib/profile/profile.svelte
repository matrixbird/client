<script>
import { createMatrixStore } from '$lib/store/matrix.svelte.js'

import Popup from '$lib/components/popup/popup.svelte'
import Menu from './menu.svelte'

const store = createMatrixStore()

import { ui_state } from '$lib/store/store.svelte.js'
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
    return 'bottom-start'
})

</script>

<Popup bind:this={popup} {placement}
    offsetDistance={10} {trigger} {content} {toggle}>

</Popup>

{#snippet content()}
    <Menu {kill} />
{/snippet}

{#snippet trigger()}
<div class="grid place-items-center w-full mb-2 select-none">
    <div class="user rounded-[50%] cursor-pointer
        hover:bg-neutral-800 grid place-items-center 
        bg-neutral-900" 
    class:active={popup_active}
    class:w-11={!expanded}
    class:h-11={!expanded}
    class:w-9={expanded}
    class:h-9={expanded}>
        <div class="font-semibold text-white uppercase">
            {initials} 
        </div>
    </div>
</div>
{/snippet}

<style lang="postcss">
@reference "tailwindcss/theme";
.active {
    transition: 0.1s;
    outline: 4px solid theme('colors.neutral.300');
}
</style>

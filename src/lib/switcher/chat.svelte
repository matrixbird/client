<script>
import { page } from '$app/state';
import { goto } from '$app/navigation';
import { tooltip } from '$lib/components/tooltip/tooltip'
import { 
    chat_solid, 
} from '$lib/assets/icons'

let { expanded, disabled } = $props();

function open() {
    if(!active) {
        //goto(`/chat`)
    }
}

let active = $derived.by(() => {
    return page.route.id.startsWith(`/(app)/chat`)
})

let opts = {
    text: "Chat",
    placement: "right",
    disabled: disabled
}

</script>

<div class="grid place-items-center cursor-not-allowed mx-1"
onclick={open} use:tooltip={opts}>

    <div class="icon p-1 rounded h-7 w-7" 
        class:h-8={!expanded}
        class:w-8={!expanded}
        class:opacity-60={disabled}
        class:active={active}>
        {@html chat_solid}
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
.active {
    fill: white;
    background-color: var(--bird-200);
}
.icon {
    fill: var(--bird-100);
}
.icon:hover {
    background-color: var(--bird-100);
}
.active:hover {
    background-color: var(--bird-200);
}
</style>

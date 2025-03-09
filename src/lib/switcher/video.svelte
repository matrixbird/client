<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { tooltip } from '$lib/components/tooltip/tooltip'
import { 
    video_solid, 
} from '$lib/assets/icons'

let { expanded, disabled } = $props();

function open() {
    if(!active) {
        //goto(`/chat`)
    }
}

let active = $derived.by(() => {
    return $page.route.id.startsWith(`/(app)/video`)
})

let opts = {
    text: "Video",
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
        {@html video_solid}
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
.active {
    fill: white;
    background-color: theme('colors.bird.200');
}
.icon {
    fill: theme('colors.bird.700');
}
.icon:hover {
    background-color: theme('colors.bird.100');
}
.active:hover {
    background-color: theme('colors.bird.200');
}
</style>

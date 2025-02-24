<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { 
    chat_outline, 
    chat_solid, 
} from '$lib/assets/icons'

function open() {
    if(!active) {
        goto(`/chat`)
    }
}

let active = $derived.by(() => {
    return $page.route.id.startsWith(`/(app)/chat`)
})

</script>

<div class="grid place-items-center cursor-pointer"
onclick={open}>

    <div class="icon p-2 rounded" class:active={active}>
        {@html chat_solid}
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
.active {
    fill: white;
    background-color: theme('colors.neutral.200');
}
.icon {
    fill: theme('colors.neutral.700');
}
.icon:hover {
    background-color: theme('colors.neutral.100');
}
.active:hover {
    background-color: theme('colors.neutral.200');
}
</style>

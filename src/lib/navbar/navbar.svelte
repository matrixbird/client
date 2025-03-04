<script>
import Profile from '$lib/profile/profile.svelte'
import NewMessage from '$lib/editor/new-message.svelte';
import ViewToggle from '$lib/components/view_toggle/view_toggle.svelte';

import { ui_state } from '$lib/store/store.svelte.js'
let compact = $derived(ui_state?.compact)

</script>

<div class="navbar grid grid-cols-3 px-4">
    <div class="flex place-items-center ">
    <Profile />
        </div>

    <div class="flex justify-center items-center w-full">
            <ViewToggle />
    </div>

    <div class="flex justify-end py-2">
        {#if !compact}
            <NewMessage />
        {/if}
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";

.navbar {
    position: fixed;
    z-index: 1;
    top: 1rem;
    width: 100%;
}

</style>


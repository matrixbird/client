<script>
import Profile from '$lib/profile/profile.svelte'
import NewMessage from '$lib/editor/new-message.svelte';
import ViewToggle from '$lib/components/view_toggle/view_toggle.svelte';

import { ui_state } from '$lib/store/app.svelte'
let expanded = $derived(ui_state?.expanded)
let sidebar_hidden = $derived(ui_state?.sidebar_hidden)

</script>

<div class="navbar grid grid-cols-3 px-4">
    <div class="flex place-items-center ">
    <Profile />
        </div>

    <div class="flex justify-center items-center w-full">
            <ViewToggle />
    </div>

    <div class="flex justify-end">
        <div class="flex justify-end ">
            {#if !expanded && sidebar_hidden}
                <NewMessage />
            {/if}
        </div>
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";

.navbar {
    margin-top: 1rem;
    margin-bottom: 1rem;
    width: 100%;
    max-height: 2rem;
}

</style>


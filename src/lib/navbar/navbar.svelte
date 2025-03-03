<script>
import Profile from '$lib/profile/profile.svelte'
import NewMessage from '$lib/editor/new-message.svelte';
</script>

<div class="navbar grid grid-cols-[auto_1fr_auto] px-4">
    <Profile />
    <div class="">
    </div>
    <div class="flex place-items-center ">
        <NewMessage />
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


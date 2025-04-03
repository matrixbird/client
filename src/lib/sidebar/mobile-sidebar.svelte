<script>
import { fly, fade } from 'svelte/transition';
import Sidebar from './sidebar.svelte';

import { toggleMobileSidebar } from '$lib/store/app.svelte';

function toggleSidebar() {
    toggleMobileSidebar();
}

</script>

<div class="mask" transition:fade={{ duration: 150 }}>
</div>

<div class="sidebar grid grid-cols-[80%_20%]" 
    in:fly={{ x: -400, duration: 150 }}
    out:fly={{ x: -300, duration: 150 }}>
    <div class="sidebar-content bg-background border-r border-border">
        <Sidebar />
    </div>
    <div class="" onclick={toggleSidebar}>
    </div>
</div>


<style lang="postcss">
@reference "tailwindcss/theme";

.sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    z-index: 10000;
}

.mask {
    background: rgba(0, 0, 0, 0.5);
}

</style>


<script>
import { draggable } from '@neodrag/svelte';
import { onMount, onDestroy } from 'svelte';
import { browser } from '$app/environment';
import { page } from '$app/state';
import { ui_state } from '$lib/store/app.svelte.js'

let {
    content
} = $props();

let window;
let header;

let expanded = $derived(ui_state?.expanded)

</script>

<div bind:this={window} class="window">

    <div bind:this={header} class="header">
    </div>

    <div class="content">
    </div>

</div>

<style lang="postcss">
@reference "tailwindcss/theme";

.window {
}
.header {
}
</style>




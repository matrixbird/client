<script>
import { page } from '$app/stores';

import Sidebar from '$lib/sidebar/sidebar.svelte'

let email_open = $derived.by(() => {
    return $page.params.email !== undefined
})

import ListView from '$lib/list-view/list-view.svelte'
let { children } = $props();
</script>

<div class="grid grid-cols-[14rem_1fr] w-full h-full overflow-hidden" >


    <Sidebar />

    <div class="overflow-hidden border-l border-border">
        {@render children()}
    </div>

</div>

<style>
.open {
    grid-template-columns: 14rem 1fr 1fr;
}
</style>


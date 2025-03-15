<script>
import { page } from '$app/state';

import Footer from '$lib/footer/footer.svelte'
import Sidebar from '$lib/sidebar/sidebar.svelte'

import { ui_state } from '$lib/store/app.svelte.js'

let expanded = $derived(ui_state?.expanded)
let sidebar_toggled = $derived(ui_state?.sidebar_toggled)

let email_open = $derived.by(() => {
    return page.params.email !== undefined
})

import ListView from '$lib/list-view/list-view.svelte'
let { children } = $props();
</script>

<div class="grid grid-rows-[1fr_auto] w-full h-full overflow-hidden" >

    <div class="grid w-full h-full overflow-hidden" 
    class:grid-cols-[14rem_1fr]={expanded || sidebar_toggled}>

        {#if expanded || sidebar_toggled}
            <Sidebar />
        {/if}

        <div class="overflow-hidden"
        class:border-l={expanded || sidebar_toggled} 
        class:border-border={expanded || sidebar_toggled}>
            {@render children()}
        </div>

    </div>

    <Footer />

</div>

<style>
.open {
    grid-template-columns: 14rem 1fr 1fr;
}
</style>


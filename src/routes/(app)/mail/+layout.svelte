<script>
import { page } from '$app/state';

import Footer from '$lib/footer/footer.svelte'
import Sidebar from '$lib/sidebar/sidebar.svelte'

import { ui_state } from '$lib/store/app.svelte'

let expanded = $derived(ui_state?.expanded)
let mobile = $derived(ui_state?.mobile)
let sidebar_hidden = $derived(ui_state?.sidebar_hidden)

let email_open = $derived.by(() => {
    return page.params.email !== undefined
})

import ListView from '$lib/list-view/list-view.svelte'
let { children } = $props();
</script>

<div class="grid grid-rows-[1fr_auto] w-full h-full overflow-hidden" >

    <div class="grid w-full h-full overflow-hidden" 
    class:grid-cols-[14rem_1fr]={(expanded || !sidebar_hidden) && !mobile}>

        {#if (expanded || !sidebar_hidden) && !mobile}
            <Sidebar />
        {/if}

        <div class="overflow-hidden"
        class:border-l={(expanded || !sidebar_hidden) && !mobile} 
        class:border-border={(expanded || !sidebar_hidden) && !mobile}>
            {@render children()}
        </div>

    </div>

    {#if !mobile}
        <Footer />
    {/if}


</div>

<style>
.open {
    grid-template-columns: 14rem 1fr 1fr;
}
</style>


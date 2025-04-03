<script>
import { glass } from '$lib/assets/icons'

import { ui_state } from '$lib/store/app.svelte'
let mobile = $derived(ui_state?.mobile)

let searchInput;
let search = $state('')

function focus() {
    searchInput.focus();
}

let focused = $state(false);

</script>


<div class="search flex place-items-center flex-1"
    class:border-bird-800={focused}
    onclick={focus}>

    {#if !mobile}
    <div class="flex place-items-center px-2 opacity-70">
        {@html glass}
    </div>
    {/if}

    <div class="text-sm flex-1 w-full">
        <input 
            bind:value={search}
            bind:this={searchInput}
            onfocus={() => focused = true}
            onblur={() => focused = false}
            type="text" 
            placeholder="Search" 
            class="w-full p-1" />
    </div>
</div>

<style>
.search {
    cursor: text;
}

input {
    border: none;
    outline: none;
}
</style>

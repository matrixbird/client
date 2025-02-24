<script>
import { page } from '$app/stores';
import { expand, collapse, close } from '$lib/assets/icons.js'
import { createStore } from '$lib/store/store.svelte.js'
const store = createStore()


let active = $derived.by(() => {
    return store.editor?.active == true
})

let expanded = $state(false)
let collapsed = $state(false)

function expandWindow() {
    if(collapsed) {
        collapsed = false
        return
    }
    expanded = !expanded
}

function collapseWindow() {
    collapsed = true
    expanded = false
}

function closeWindow() {
    store.editor.active = false
}

</script>

{#if active}
<div class="box editor grid grid-rows-[auto_1fr] select-none"
class:base={!expanded}
class:expand={expanded}>

    <div class="flex bg-neutral-900 p-1 text-white font-medium"
    >

        <div class="flex place-items-center cursor-pointer text-sm ml-1 tracking-wide
">
            New Message
        </div>

        <div class="flex-1 flex place-items-center ml-3">
        </div>
        <div class="cursor-pointer flex place-items-center mr-1"
        onclick={expandWindow}>
            {#if expanded}
                {@html collapse}
            {:else}
                {@html expand}
            {/if}
        </div>
        <div class="cursor-pointer flex place-items-center mr-1"
        onclick={closeWindow}>
                {@html close}
        </div>
    </div>

    {#if !collapsed}
    <div class="content">
        editor
    </div>
    {/if}
</div>
{/if}

{#if expanded}
    <div class="mask" onclick={collapseWindow}>
    </div>
{/if}

<style>
.editor {
    z-index: 100;
    position: fixed;
}

.content {
    min-height: 50dvh;
}

.base {
    bottom: 0;
    right: 4rem;
    width: 600px;
}

.expand {
    top: 3rem;
    bottom: 3rem;
    right: 10rem;
    left: 10rem;
}

.mask {
    z-index: 99;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
}
</style>

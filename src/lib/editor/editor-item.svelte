<script>
import { 
    expand, 
    collapse, 
    minimize, 
    maximize,
    close 
} from '$lib/assets/icons.js'

import { createStore } from '$lib/store/store.svelte.js'
const store = createStore()

let { item, index } = $props();

let expanded = $state(false)
let minimized = $state(false)

function expandWindow() {
    if(minimized) {
        minimized = false
        return
    }
    expanded = !expanded
}

function minimizeWindow() {
    minimized = true
    expanded = false
}

function toggleCollapse() {
    minimized = true
    expanded = false
}

function closeWindow() {
    store.killEditor(item.id)
}
</script>

<div class="box editor grid grid-rows-[auto_1fr] 
    min-w-[34rem]
    select-none"
class:base={!expanded}
class:expand={expanded}>

    <div class="flex bg-neutral-900 text-white font-medium"
    >

        <div class="flex p-2 flex-1 place-items-center cursor-pointer text-sm ml-1 tracking-wide"
            onclick={toggleCollapse}>
            New Message
        </div>


        <div class="cursor-pointer flex place-items-center mr-1"
        onclick={minimizeWindow}>
                {#if minimized}
                    {@html maximize}
                {:else}
                    {@html minimize}
                {/if}
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

    {#if !minimized}
    <div class="content">
            {index}
        editor
            {item.id}
    </div>
    {/if}
</div>

{#if expanded}
    <div class="mask" onclick={minimizeWindow}>
    </div>
{/if}

<style>
.editor {
    z-index: 100;
}

.content {
    min-height: 48dvh;
}

.base {
}

.expand {
    position: fixed;
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

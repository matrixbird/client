<script>
import { alert, killAlert } from '$lib/store/store.svelte.js'

let active = $derived.by(() => {
    return alert?.active && alert?.message
})

let title = $derived.by(() => {
    return alert?.title
})

let message = $derived.by(() => {
    return alert?.message
})

function kill(e) {
    if(e.target == e.currentTarget) {
        killAlert()
    }
}

</script>

{#if active}
<div class="mask grid items-center">
</div>

<div class="alert h-screen w-full grid place-items-center" 
    onclick={kill}>
    <div class="box grid grid-rows-[auto_1fr_auto] p-4 
        min-w-[300px] max-w-[500px]">
        <div class="font-medium">
            {title || 'Error'}
        </div>
        <div class="mt-4 leading-5 text-md">
            {@html message}
        </div>
        <div class="flex justify-end mt-4">
            <button onclick={killAlert} class="primary px-4 py-2 font-sm ">OK</button>
        </div>
    </div>
</div>
{/if}

<style>
.mask {
    background-color: rgba(0, 0, 0, 0.2);
    z-index: 200;
}
.alert {
    z-index: 1000;
    position: fixed;
    top: 0;
}
button {
    border-radius: 500px;
    border: none;
    cursor: pointer;
}
</style>

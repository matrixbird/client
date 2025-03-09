<script>
import { PUBLIC_HOMESERVER } from '$env/static/public';
import logo from '$lib/logo/logo.js'
import { onMount, tick } from 'svelte';

import {
	goto,
} from '$app/navigation';

import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()


let { data } = $props();

$effect(() => {
})

onMount(() => {
    nameInput.focus();
    if(data) {
        //store.updateSession(data)
        setTimeout(() => {
            store.createMatrixClient(data)
        }, 1000)
    }
});


let busy = $state(false);

function startClient() {
    store.createMatrixClient(data)
}

async function goHome() {
    await store.createMatrixClient(data)
    goto('/mail/inbox')
}

let nameInput;
let name = $state('');

async function save() {
    if(name == '') {
        nameInput.focus();
        return;
    }
    busy = true
    await store.createMatrixClient(data)
    let resp = await store.client.setDisplayName(name);
    console.log(resp)
    goto('/mail/inbox')
}

</script>

<div class="box w-full flex flex-col" 
    class:bobble={busy}>

    <div class="flex p-4 box-title">
        <div class="flex items-center flex-1 font-medium">
            Your profile
        </div>

        <div class="flex place-items-center">
            <div class="w-[1.5rem] sm:w-[1.8rem]">
                {@html logo}
            </div>
        </div>
    </div>

    <div class="content flex-1 flex flex-col p-4 ">
        <div class="mt-2">
            <input 
                class="py-3 pl-3 pr-[164px]"
                bind:this={nameInput} 
                bind:value={name} 
                disabled={busy}
                type="text" 
                placeholder="Choose a name" />
        </div>

        <div class="mt-4">
            <button class="primary py-4 w-full" 
                disabled={busy}
                onclick={save}>
                {busy ? 'Saving...' : 'Finish'}
            </button>
        </div>
        <div class="mt-3 text-center">
            <span onclick={goHome}
                class="text-md text-bird-800 hover:underline cursor-pointer">
                Skip for now
            </span>
        </div>
    </div>

</div>


<style>

.box-title {
    border-bottom: 1px solid #dadada;
}


@keyframes bobble {
0%, 100% {
    transform: translateY(0);
    box-shadow: 6px 6px 0 #a7a7a729;
}
50% {
    transform: translateY(-10px);
    box-shadow: 10px 10px 0 #4b4b4b29;
}
}

.bobble {
    animation: bobble 0.6s ease-in-out infinite;
}

</style>

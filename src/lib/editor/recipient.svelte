<script>
import { onMount, onDestroy } from 'svelte';
import { close_small } from '$lib/assets/icons'
import { valid_email } from '$lib/appservice/api'

import { createMatrixStore } from '$lib/store/matrix.svelte';

const store = createMatrixStore();

let { 
    item,
    to_focused,
    validateEmail,
    removeEmail
} = $props();

let el;

let valid = $derived(item?.valid)
let highlight = $derived(item?.highlight)

$effect(() => {
    if(highlight && el) {
        setTimeout(() => {
            document.addEventListener('keydown', handleBackspace)
        }, 100)
    }
    if(!highlight && el) {
        document.removeEventListener('keydown', handleBackspace)
    }
})

function handleBackspace(e) {
    if(e.key === 'Backspace') {
        removeEmail(item.email)
    }
}

onDestroy(() => {
    document.removeEventListener('keydown', handleBackspace)
})

onMount(async() => {
    let resp = await valid_email(item.email);
    console.log(resp)
    if(resp?.valid && resp?.mxid) {
        validateEmail(item.email)
        let profile = await store.client.getProfileInfo(resp.mxid)
        console.log(profile)
    }
})

function remove(e) {
    removeEmail(item.email)
}

</script>

<div bind:this={el}
    class="flex place-items-center my-2 px-2 mr-2
    hover:border-bird-500 duration-100
    border border-bird-400
    bg-bird-50 rounded cursor-pointer"
    class:border-bird-800={valid}
    class:outline={highlight}
    onclick={remove}>
    <div class="">
        {item.email}
    </div>
    <div class="cursor-pointer font-semibold ml-1">
        {@html close_small}
    </div>
</div>


<style lang="postcss">
@reference "tailwindcss/theme";
</style>


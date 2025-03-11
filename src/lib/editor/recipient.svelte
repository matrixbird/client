<script>
import { onMount, onDestroy } from 'svelte';
import { close_small } from '$lib/assets/icons'
import { valid_email, valid_domain } from '$lib/appservice/api'

import UserAvatar from '$lib/user/avatar.svelte'

import {
    get_email_domain
} from '$lib/utils/matrix.js'

import { createMatrixStore } from '$lib/store/matrix.svelte';

const store = createMatrixStore();

let { 
    item,
    to_focused,
    validateEmail,
    validateEmailDomain,
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

let profile = $state(null);

let display_name = $derived.by(() => {
    if(profile?.displayname) {
        return `${profile.displayname} (${item.email})`
    }
    return item.email
})

let mxid = $state(null)

onMount(async() => {
    let resp = await valid_email(item.email);
    if(resp?.valid && resp?.mxid) {
        mxid = resp.mxid
        validateEmail(item.email)
        let pr = await store.client.getProfileInfo(resp.mxid)
        if(pr) {
            console.log(pr)
            profile = pr
        }
    }

    if(!resp?.valid) {
        let domain = get_email_domain(item.email)
        resp = await valid_domain(domain);
        if(resp?.valid) {
            validateEmailDomain(item.email)
        }
    }
})

function remove(e) {
    removeEmail(item.email)
}

</script>

<div bind:this={el}
    class="flex place-items-center my-2 pl-1 mr-1
    hover:border-bird-900 duration-100
    border border-bird-400
    bg-bird-50 hover:bg-bird-100 rounded-[500px] cursor-default"
    class:border-bird-800={valid}
    class:border-bird-900={highlight}
    class:border-[2px]={highlight}
    class:bg-bird-200={highlight}>

    {#if valid && profile && mxid}
        <UserAvatar user_id={mxid} small={true} />
    {/if}

    <div class="ml-1">
        {display_name}
    </div>
    <div class="cursor-pointer font-semibold pl-1 pr-2"
    onclick={remove}>
        {@html close_small}
    </div>
</div>


<style lang="postcss">
@reference "tailwindcss/theme";
</style>


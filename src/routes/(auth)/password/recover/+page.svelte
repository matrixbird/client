<script>
import { PUBLIC_HOMESERVER_NAME } from '$env/static/public';
import logo from '$lib/logo/logo.js'
import { onMount, tick } from 'svelte';

import { 
    request_invite,
} from '$lib/appservice/api.js';

import { 
    debounce
} from '$lib/utils/utils';


onMount(() => {
    emailInput.focus();
});

let emailInput;
let email = $state('');

let busy = $state(false);

function validate(event) {

    if (event.key.length > 1) return;

    const regex = /^[a-zA-Z0-9]$/;
    if (!regex.test(event.key)) {
      event.preventDefault();
    }

    if(email.length === 0) {
        return;
    }

    if(event.key === 'Enter') {
        process();
    }


}

function onKeydown(event) {
    if(event.key === 'Enter') {
        process();
    }
}

let bad_login = $state(false);
let server_down = $state(false);

let success = $state(false);

async function process() {

    if(email.length === 0) {
        emailInput.focus();
        return;
    }

    busy = true

    try {
        let response = await request_invite(email)
        if(response?.error) {
            bad_login = true
        } else {
            bad_login = false
        }

        console.log('response', response)

        if(response?.sent) {
            success = true
        }


    } catch (err){
        server_down = true
        console.log('error', err)
    } finally {
        busy = false
    }
}


let focused = $state(false);

</script>

<div class="box w-full flex flex-col" 
    class:bobble={busy}>

    <div class="flex p-4 border-b border-border">

        <div class="flex items-center flex-1 font-medium">
            Recover your account
        </div>

        <div class="flex place-items-center">
            <div class="w-[1.5rem] sm:w-[1.8rem]">
                {@html logo}
            </div>
        </div>

    </div>

    <div class="content flex-1 flex flex-col p-4 mt-2 mb-2">
        <div class="flex leading-6">
            Please enter the email address connected to your account. We'll send
            you a verification code.
        </div>

        <div class="mt-4 relative">
            <input 
                class="py-3 pl-3 pr-[164px]"
                bind:this={emailInput} 
                bind:value={email} 
                type="text" 
                disabled={busy}
                onfocus={() => focused = true}
                onblur={() => focused = false}
                maxlength="30"
                onkeydown={validate}
                placeholder="user" />

            <div class:focus={focused} 
                onclick={() => emailInput.focus()}
                class="server pointer-events-none
    select-none flex items-center px-3 ml-[-1px] border border-bird-900">
                @{PUBLIC_HOMESERVER_NAME}
            </div>

        </div>


        {#if server_down}
            <div class="mt-6 text-red-600 text-center">
                Could not reach server. Try again later.
            </div>
        {/if}

        {#if bad_login}
            <div class="mt-6 text-red-600 text-center">
                Invalid email or password
            </div>
        {/if}

        <div class="mt-6 ">
            <button 
                class="primary px-2 w-full py-3 text-base" 
                disabled={busy}
                onclick={process}>
                Send code
            </button>
        </div>

    </div>
</div>

<div class="grid place-items-center w-full mt-6">
    <div class="">
        <span class="text-bird-700">Already have an account?</span>
        <a href="/login" class="text-bird-900 underline">
            Log in
        </a>
    </div>
</div>

<style>

.focus {
    border-left: 2px solid #464646;
    border-radius: 0 4px 4px 0;
}
.server {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
}
</style>

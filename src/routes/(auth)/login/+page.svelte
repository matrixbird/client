<script>
import { PUBLIC_HOMESERVER_NAME } from '$env/static/public';
import logo from '$lib/logo/logo.js'
import { onMount, tick } from 'svelte';

import {
	goto,
} from '$app/navigation';

import { 
    login as appservice_login,
} from '$lib/appservice/api';

import { createMatrixStore } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

onMount(() => {
    usernameInput.focus();
});

let usernameInput;
let username = $state('');

let passwordInput;
let password = $state('');

let busy = $state(false);

function focusPassword(event) {
    if(event.key === 'Enter') {
        passwordInput.focus();
    }

    if (event.key.length > 1) return;

    const regex = /^[a-zA-Z0-9]$/;
    if (!regex.test(event.key)) {
      event.preventDefault();
    }

    if(username.length === 0) {
        return;
    }

}

function onKeydown(event) {
    if(event.key === 'Enter') {
        login();
    }
}

let bad_login = $state(false);
let server_down = $state(false);

async function login() {

    if(username.length === 0) {
        usernameInput.focus();
        return;
    }

    if(password.length === 0) {
        passwordInput.focus();
        return;
    }

    busy = true

    try {
        let response = await appservice_login({
            user: username,
            password: password
        })
        if(response?.error) {
            bad_login = true
            busy = false
        } else {
            bad_login = false
        }
        console.log('response', response)

        if(response?.session_id && response?.access_token) {

            const res = await fetch('/api/auth/session', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: response.session_id,
                    access_token: response.access_token,
                    device_id: response.device_id,
                    user_id: response.user_id,
                }),
            });

            const json = await res.json();

            console.log("resp", json)

            store.createMatrixClient({
                user_id: response.user_id,
                access_token: response.access_token,
                device_id: response.device_id,
            })

            goto('/mail/inbox')
        }


    } catch (err){
        server_down = true
        console.log('error', err)
        busy = false
    } finally {
        await tick()
        passwordInput.focus();
    }
}

let button_text = $derived.by(() => {
    return busy ? 'Logging in...' : 'Log In'
})

let focused = $state(false);

</script>

<div class="box w-full flex flex-col" 
    class:bobble={busy}>

    <div class="flex p-4 border-b border-border">

        <div class="flex items-center flex-1 font-medium">
            Log In
        </div>

        <div class="flex place-items-center">
            <div class="w-[1.5rem] sm:w-[1.8rem]">
                {@html logo}
            </div>
        </div>

    </div>

    <div class="content flex-1 flex flex-col p-4 mt-4">
        <div class="con">
            <input 
                class="py-3 pl-3 pr-[164px]"
                bind:this={usernameInput} 
                bind:value={username} 
                type="text" 
                disabled={busy}
                onkeydown={focusPassword}
                onfocus={() => focused = true}
                onblur={() => focused = false}
                maxlength="30"
                placeholder="user" />

            <div class:focus={focused} 
                onclick={() => usernameInput.focus()}
                class="server pointer-events-none
 select-none flex items-center px-3 ml-[-1px] border border-bird-900">
                @{PUBLIC_HOMESERVER_NAME}
            </div>

        </div>

        <div class="mt-3">
            <input 
                class="py-3 px-3"
                bind:this={passwordInput} 
                bind:value={password} 
                type="password" 
                disabled={busy}
                onkeydown={onKeydown}
                placeholder="password" />
        </div>

        {#if server_down}
            <div class="mt-6 text-red-600 text-sm">
                Could not reach server. Try again later.
            </div>
        {/if}

        {#if bad_login}
            <div class="mt-6 text-red-600 text-sm">
                Invalid username or password
            </div>
        {/if}

        <div class="mt-6">
            <button 
                class="primary px-2 w-full py-3 text-base" 
                disabled={busy}
                onclick={login}>
                {button_text}
            </button>
        </div>

        <div class="mt-4">
            <a href="/password/recover" class="text-bird-900 text-sm
                hover:underline">Forgot password?</a>
        </div>
    </div>
</div>

<div class="grid place-items-center w-full mt-6">
    <div class="">
        <span class="text-bird-700">Don't have an account?</span>
        <a href="/signup" class="text-bird-900 underline">
            Sign up
        </a>
    </div>
</div>

<style>
input {
    border-radius: 2px;
}
.focus {
    border-left: 2px solid #464646;
    border-radius: 0 4px 4px 0;
}

.con {
    position: relative;
}

.server {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
}
</style>

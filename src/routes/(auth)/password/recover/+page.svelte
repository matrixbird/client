<script lang="ts">
import { PUBLIC_HOMESERVER_NAME } from '$env/static/public';
import logo from '$lib/logo/logo'
import { onMount, tick } from 'svelte';
import { v4 as uuidv4 } from 'uuid';

import { goto } from '$app/navigation';

import { updateSession } from '$lib/store/session.svelte'
import { createMatrixStore } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

import { 
    request_password_reset,
    verify_password_reset_code,
    update_password,
} from '$lib/appservice/api';

import { 
    showPassword,
    hidePassword,
} from '$lib/assets/icons';


$effect(() => {
    if(!sent && !verified && usernameInput) {
        usernameInput.focus();
    }
    if(sent && codeInput) {
        codeInput.focus();
    }
    if(verified && passwordInput) {
        passwordInput.focus();
    }
})

let usernameInput: HTMLInputElement;
let username = $state('');

let busy = $state(false);
let client_secret: string | undefined = $state(undefined);
let session: string | undefined = $state(undefined);

function validate(event: KeyboardEvent) {

    if(event.key === 'Enter') {
        process();
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

let bad_login = $state(false);
let server_down = $state(false);

let sent = $state(false);
let verified = $state(false);

async function process() {

    if(username.length === 0) {
        usernameInput.focus();
        return;
    }

    busy = true
    client_secret = uuidv4()

    try {
        let response = await request_password_reset({
            username: username,
            client_secret: client_secret
        })
        if(response?.error) {
            bad_login = true
        } else {
            bad_login = false
        }

        console.log('response', response)

        if(response?.session) {
            session = response.session
            sent = true
        }


    } catch (err){
        server_down = true
        console.log('error', err)
    } finally {
        busy = false
    }
}


let focused = $state(false);

let codeInput: HTMLInputElement;
let code = $state('');

let bad_code = $state(false);

let success = $state(true);

async function verifyCode() {

    if(code.length === 0) {
        code.focus();
        return;
    }


    busy = true

    try {
        let response = await verify_password_reset_code({
            client_secret: client_secret,
            session: session,
            code: code
        })

        if(response?.error) {
            console.log('error', response.error)
            bad_code = true
        }

        if(response?.verified) {
            console.log('verified', response)
            verified = true
        }


    } catch (err){
        console.log('error', err)
    } finally {
        busy = false
        await tick()
    }
}

function handleEnter(event) {

    if(sent && codeInput) {
        if(code.length === 0) {
            return;
        }
        if(event.key === 'Enter') {
            verifyCode();
        }
    } else if(emailInput) {

        if(email.length === 0) {
            return;
        }
        if(event.key === 'Enter') {
            verify();
        }
    }

}

let passwordInput: HTMLInputElement;
let password = $state('');

let passwordVisible = $state(false);

async function togglePassword() {
    passwordVisible = !passwordVisible;
    if(passwordVisible) {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }

    await tick();
    passwordInput.focus();
}

async function updatePassword() {

    if(passwordInput.length < 8) {
        passwordInput.focus();
        return;
    }

    busy = true

    try {
        let response = await update_password({
            client_secret: client_secret,
            session: session,
            password: password
        })

        if(response?.session_id && response?.access_token) {

            success = true

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

            updateSession({
                session_id: response.session_id,
                user_id: response.user_id,
                access_token: response.access_token,
                device_id: response.device_id,
            })

            store.createMatrixClient({
                session_id: response.session_id,
                user_id: response.user_id,
                access_token: response.access_token,
                device_id: response.device_id,
            })

            goto('/mail/inbox')
        }


    } catch (err){
        console.log('error', err)
    } finally {
        busy = false
        await tick()
    }
}

function handlePasswordEnter(event) {
    if(event.key === 'Enter') {
        updatePassword();
    }
}

</script>

<div class="box w-full flex flex-col" 
    class:bobble={busy}>

    <div class="flex p-4 border-b border-border">

        <div class="flex items-center flex-1 font-medium">
            {#if !sent && !verified && !success}
                Recover your account
            {:else if sent && !verified && !success}
                Verify your email
            {:else if verified && !success}
                Set a new password
            {:else if success}
                Password updated
            {/if}
        </div>

        <div class="flex place-items-center">
            <div class="w-[1.5rem] sm:w-[1.8rem]">
                {@html logo}
            </div>
        </div>

    </div>



    {#if !sent && !verified && !success}

    <div class="content flex-1 flex flex-col p-4 mt-2 mb-2">
        <div class="leading-6">
            Please enter your <strong>{PUBLIC_HOMESERVER_NAME}</strong> address. We'll send a verification code to the recovery email connected to your account.
        </div>

        <div class="mt-4 relative">
            <input 
                class="py-3 pl-3 pr-[164px]"
                bind:this={usernameInput} 
                bind:value={username} 
                type="text" 
                disabled={busy}
                onfocus={() => focused = true}
                onblur={() => focused = false}
                maxlength="30"
                onkeydown={validate}
                placeholder="username" />

            <div class:focus={focused} 
                onclick={() => usernameInput.focus()}
                class="server pointer-events-none
    select-none flex items-center px-3 ml-[-1px] border-l border-bird-900">
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
                Invalid username or password
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
    {/if}

    {#if sent && !verified && !success}

    <div class="content flex-1 flex flex-col p-4 mt-2 mb-2">
        <div class="leading-6">
            Enter the code we sent to your email address.
        </div>

        <div class="con mt-4 relative">
            <input 
                class="py-3 pl-3 pr-[164px]"
                type="email" 
                maxlength="30"
                bind:this={codeInput} 
                bind:value={code} 
                onkeydown={handleEnter}
                placeholder="verification code" />

            {#if busy}
                <div class="spinner-sm absolute right-4 top-4"></div>
            {/if}

        </div>

        {#if bad_code}
            <div class="mt-6 text-sm">
                The code you entered is incorrect. 
                <span onclick={reset} class="cursor-pointer underline">Start over?</span>
            </div>
        {/if}


        <div class="mt-6">
            <button 
                onclick={verifyCode}
                class="primary px-2 w-full py-3 text-base" >
                    Verify Code
            </button>
        </div>

    </div>
    {/if}

    {#if verified && !success}

    <div class="content flex-1 flex flex-col p-4 mt-2 mb-2">
        <div class="leading-6">
            Choose a new password for your account.
        </div>

        <div class="con mt-4 relative">
            <input 
                class="py-3 pl-3 pr-[164px]"
                type="password" 
                minlength="8"
                bind:this={passwordInput} 
                bind:value={password} 
                disabled={busy}
                onkeydown={handlePasswordEnter}
                placeholder="new password" />

            <div class="absolute right-[10px] top-[13px] cursor-pointer flex
                place-items-center opacity-70 hover:opacity-100"
                onclick={togglePassword}>
                {#if passwordVisible}
                    {@html hidePassword}
                {:else}
                    {@html showPassword}
                {/if}
            </div>

        </div>

        <div class="mt-6">
            <button 
                onclick={updatePassword}
                class="primary px-2 w-full py-3 text-base" >
                    Reset Password
            </button>
        </div>

    </div>
    {/if}

    {#if success}

    <div class="content flex-1 flex flex-col p-4 mt-2 mb-2">
        <div class="leading-6">
            Your password has been updated. We'll log you in now...
        </div>

    </div>
    {/if}

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

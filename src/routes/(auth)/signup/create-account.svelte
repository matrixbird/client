<script>
import { PUBLIC_HOMESERVER_NAME } from '$env/static/public';
import { onMount, tick } from 'svelte';
import { v4 as uuidv4 } from 'uuid';
import { passwordStrength } from 'check-password-strength'


import { 
    signup,
    usernameAvailable,
} from '$lib/appservice/api.js';

import { 
    showPassword,
    hidePassword,
} from '$lib/assets/icons.js';

import {
    goto,
} from '$app/navigation';

import { page } from '$app/state';

import { createMatrixStore } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

import { userState } from '$lib/store/app.svelte'

import { 
    debounce
} from '$lib/utils/utils';

let { 
    data, 
    session 
} = $props();

let require_invite_code = $derived.by(() => {
    return data?.features?.require_invite_code
})

let code_valid = $derived.by(() => {
    return data?.invite_code?.valid === true
})

let invite_code_email = $derived.by(() => {
    return data?.invite_code?.email
})

let code_in_url = $derived.by(() => {
    return data?.invite_code?.code
})

let lock_code_input = $derived.by(() => {
    return code_valid && invite_code_email
})


$effect(() => {
    //console.log(code_in_url)
})

onMount(() => {
    usernameInput.focus();
});

let usernameInput;
let username = $state('');

let passwordInput;
let password = $state('');

let codeInput;
let code = $state(code_in_url || '');


let busy = $state(false);
let unavailable = $state(false);

function handleKeydown(event) {
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

function startProcess(event) {
    if(event.key === 'Enter') {
        process();
    }
}

function checkPasswordStrength(event) {
    //console.log(passwordStrength(password).value)
}

function codeEnter(event) {
    if(code.length === 0) {
        codeInput.focus();
        return;
    }
    if(event.key === 'Enter') {
        process();
    }
}

function nameEnter(event) {
    if(name.length === 0) {
        nameInput.focus();
        return;
    }
    if(event.key === 'Enter') {
        usernameInput.focus();
    }
}

let failed = $state(false);
let bad_invite_code = $state(false);
let server_down = $state(false);

async function process() {

    if(username.length === 0) {
        usernameInput.focus();
        return;
    }

    if(password.length === 0) {
        passwordInput.focus();
        return;
    }

    if(require_invite_code && code.length === 0) {
        passwordInput.focus();
        return;
    }

    busy = true

    try {
        let response = await signup({
            username: username.toLowerCase(),
            password: password,
            session: session?.session || uuidv4(),
            client_secret: session?.client_secret || uuidv4(),
            invite_code: code || null,
        })

        if(response?.error && response?.invited == false) {
            bad_invite_code = true
        } else {
            bad_invite_code = false
        }

        if(response?.error && response.invited == undefined) {
            failed = true
        } else {
            failed = false
        }

        if(response?.available == false) {
            unavailable = true
        }

        if(response.session_id) {
            await fetch('/api/auth/session', {
                method: 'POST',
                body: JSON.stringify({
                    session_id: response.session_id,
                    access_token: response.access_token,
                    device_id: response.device_id,
                    user_id: response.user_id,
                }),
            });
            userState.new_user = true

            /*
            store.createMatrixClient({
                user_id: response.user_id,
                access_token: response.access_token,
                device_id: response.device_id,
            })
            */

            //goto('/mail/inbox')
            goto('/signup/profile')
        }


    } catch (err){
        server_down = true
        busy = false
        console.log('error', err)
    } finally {
        await tick()
        if(bad_invite_code) {
            codeInput.focus();
            busy = false
        } else if(failed) {
            busy = false
        } else if(unavailable) {
            usernameInput.focus();
            busy = false
        } else {
            passwordInput.focus();
            //busy = false
        }
    }
}

let button_text = $derived.by(() => {
    return busy ? 'Signing Up...' : 'Sign Up'
})

let checking = $state(false);
let username_available = $state(false);
let username_unavailable = $state(false);

function checkUsername(e) {
    debounce(async() => {
        username_available = false;
        username_unavailable = false;
        if(username?.length == 0) return
        checking = true;


        try {
            let available = await usernameAvailable(username)
            if(available) {
                username_available = true;
            } else {
                username_unavailable = true;
            }
            console.log('available', available)
        } catch(err) {
            console.warn(err)
            username_unavailable = true;
        }

        checking = false;
    }, 350)
}

let focused = $state(false);

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

</script>

<div class="content flex-1 flex flex-col p-4 mt-4 mb-2">

    <div class="con">
        <input 
            class="py-3 pl-3 pr-[164px]"
            bind:this={usernameInput} 
            bind:value={username} 
            type="text" 
            disabled={busy}
            oninput={checkUsername}
            onkeydown={handleKeydown}
            maxlength="30"
            onfocus={() => focused = true}
            onblur={() => focused = false}
            placeholder="user" />

        <div class:focus={focused} 
            onclick={() => usernameInput.focus()}
            class="server pointer-events-none
            select-none flex items-center px-3 ml-[-1px] border border-bird-900">
            @{PUBLIC_HOMESERVER_NAME}
        </div>

    </div>

    <div class="password mt-3 relative">
        <input id="password" name="password"
            class="py-3 px-3"
            bind:this={passwordInput} 
            bind:value={password} 
            type="password" 
            autocomplete="new-password"
            disabled={busy}
            oninput={checkPasswordStrength}
            onkeydown={startProcess}
            placeholder="Password" />

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

    {#if code_valid && invite_code_email}
        <div class="mt-3">
            <input 
                class="py-3 px-3"
                type="email" 
                disabled
                value={invite_code_email} />
        </div>
    {/if}

    {#if require_invite_code}
        <div class="mt-3">
            <input 
                class="py-3 px-3"
                bind:this={codeInput} 
                bind:value={code} 
                type="text" 
                disabled={busy || lock_code_input}
                onkeydown={codeEnter}
                placeholder="Invite Code" />
        </div>
    {/if}



    {#if server_down}
        <div class="mt-6 text-red-600 text-sm">
            Could not reach server. Try again later.
        </div>
    {/if}

    {#if failed}
        <div class="mt-6 text-red-600 text-sm">
            Could not create account. Try again later.
        </div>
    {/if}

    {#if bad_invite_code}
        <div class="mt-6 text-red-600 text-sm">
            Invalid invite code.
        </div>
    {/if}

    <div class="mt-6">
        <button 
            class="primary px-2 w-full py-3 text-base" 
            disabled={busy}
            onclick={process}>
            {button_text}
        </button>
    </div>

    {#if require_invite_code && !code_valid && !invite_code_email}
        <div class="mt-4">
            <a href="/request/invite" class="text-bird-900 text-sm
                hover:underline">Need an invite code?</a>
        </div>
    {/if}
</div>

<style>
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

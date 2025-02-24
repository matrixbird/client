<script>
import logo from '$lib/logo/logo.js'
import { onMount, tick } from 'svelte';
import * as EmailValidator from 'email-validator';

import { 
    request_invite,
} from '$lib/appservice/api.js';

import { 
    debounce
} from '$lib/utils/utils.js';


onMount(() => {
    emailInput.focus();
});

let emailInput;
let email = $state('');

let busy = $state(false);

function validate(event) {
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

let bad_email = $state(false);
let server_down = $state(false);

let invalid_email = $state(false);

let success = $state(false);

async function process() {

    if(email.length === 0) {
        emailInput.focus();
        return;
    }

    let email_valid = EmailValidator.validate(email);
    console.log('email_valid', email_valid)

    if(!email_valid) {
        invalid_email = true;
        emailInput.focus();
        return;
    }

    busy = true

    try {
        let response = await request_invite(email)
        if(response?.error && response?.success == false) {
            bad_email = true
        } else {
            bad_email = false
        }

        if(response?.success) {
            success = true
        }


    } catch (err){
        server_down = true
        console.log('error', err)
    } finally {
        busy = false
        await tick()
        if(emailInput) {
            emailInput.focus();
        }
    }
}


</script>

<div class="box w-full flex flex-col" 
    class:bobble={busy}>

    {#if success}

        <div class="flex p-4 box-title">

            <div class="flex items-center flex-1 font-medium">
                Thank you
            </div>

            <div class="flex place-items-center">
                <div class="w-[1.5rem] sm:w-[1.8rem]">
                    {@html logo}
                </div>
            </div>

        </div>

        <div class="content flex-1 flex flex-col p-4 mt-2 mb-2">
            <div class="flex leading-6">
                We have received your request. We will send you an email when
                your account is ready.
            </div>
        </div>

    {/if}


    {#if !success}
    <div class="flex p-4 box-title">

        <div class="flex items-center flex-1 font-medium">
            Request an Invite
        </div>

        <div class="flex place-items-center">
            <div class="w-[1.5rem] sm:w-[1.8rem]">
                {@html logo}
            </div>
        </div>

    </div>

    <div class="content flex-1 flex flex-col p-4 mt-2 mb-2">
        <div class="flex leading-6">
            Enter your email to request an invite – we'll
                reach out when your account is ready.
        </div>

        <div class="mt-4">
            <input 
                class="py-3 px-3"
                bind:this={emailInput} 
                bind:value={email} 
                type="email" 
                disabled={busy}
                maxlength="40"
                onkeydown={validate}
                placeholder="you@work-email.com" />
        </div>

        {#if invalid_email}
            <div class="mt-4 text-red-600 leading-6 text-sm">
                Please enter a valid email address.
            </div>
        {/if}

        {#if server_down}
            <div class="mt-6 text-red-600 leading-6 text-sm">
                Could not reach server. Try again later.
            </div>
        {/if}

        {#if bad_email}
            <div class="mt-6 text-red-600 leading-6 text-sm">
                You'll need to use a different email address.
            </div>
        {/if}

        <div class="mt-6 ">
            <button 
                class="primary px-2 w-full py-3 text-base" 
                disabled={busy}
                onclick={process}>
                Request Invite
            </button>
        </div>

    </div>
    {/if}

</div>

<div class="grid place-items-center w-full mt-6">
    <div class="">
        <span class="text-neutral-700">Already have an account?</span>
        <a href="/login" class="text-neutral-900 underline">
            Log in
        </a>
    </div>
</div>

<style>
.box {
    background: white;
    border: 1px solid #464646;
    box-shadow: 6px 6px 0 #a7a7a729;
    transform: translate(0, 0);
    border-radius: 1px;
}

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

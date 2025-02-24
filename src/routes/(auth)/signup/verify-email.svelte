<script>
import { onMount, tick } from 'svelte';
import { v4 as uuidv4 } from 'uuid';
import * as EmailValidator from 'email-validator';


import { 
    verify_email,
    verify_code
} from '$lib/appservice/api.js';


let { setVerified } = $props();

onMount(() => {
    emailInput.focus();
});

let emailInput;
let email = $state('');

let busy = $state(false);
let sent = $state(false);

let invalid_email = $state(false);
let email_exists = $state(false);
let bad_email = $state(false);

let client_secret = $state(null);
let session = $state(null);

async function verify() {

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

    client_secret = uuidv4()

    try {
        let response = await verify_email({
            email: email,
            client_secret: client_secret
        })

        if(response?.error && response?.exists) {
            console.log('error', response.error)
            email_exists = true
        }

        if(response?.error && response?.reject) {
            console.log('error', response.error)
            bad_email = true
            invalid_email = false
        }


        if(response?.session) {
            session = response.session
            sent = true
            email_exists = false
            invalid_email = false
            bad_email = false
        }


    } catch (err){
        console.log('error', err)
    } finally {
        busy = false
        await tick()
        if(emailInput && !sent) {
            emailInput.focus();
        }
        if(codeInput && sent) {
            codeInput.focus();
        }
    }
}

let codeInput;
let code = $state('');

let bad_code = $state(false);

async function verifyCode() {

    if(code.length === 0) {
        code.focus();
        return;
    }


    busy = true

    try {
        let response = await verify_code({
            email: email,
            client_secret: client_secret,
            session: session,
            code: code
        })

        if(response?.error) {
            console.log('error', response.error)
            bad_code = true
        }

        if(response?.verified) {
            setVerified({
                verified: true,
                email: email,
                client_secret: client_secret,
                session: session,
            })
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


async function reset() {
    sent = false;
    email = '';
    code = '';
    email_exists = false
    invalid_email = false
    bad_email = false
    bad_code = false
    busy = false

    await tick()
    emailInput.focus();
}

</script>

{#if sent}
<div class="content flex-1 flex flex-col p-4 mt-4">

    <div class="leading-6">
        Enter the code we sent to your email address.
    </div>

    <div class="con mt-4">
        <input 
            class="py-3 pl-3 pr-[164px]"
            type="email" 
            maxlength="30"
            bind:this={codeInput} 
            bind:value={code} 
            onkeydown={handleEnter}
            placeholder="verification code" />

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
            class="bg-neutral-900 text-white px-2 w-full py-3 uppercase
            text-base font-medium" >
                Verify Code
        </button>
    </div>

</div>
{/if}

{#if !sent}
<div class="content flex-1 flex flex-col p-4 mt-4">

    <div class="leading-6 mb-4">
        We'll need to verify your email first.
        Please enter your email address. 
    </div>

    <div class="relative">
        <input 
            class="py-3 pl-3 pr-[164px]"
            type="email" 
            maxlength="30"
            bind:this={emailInput} 
            bind:value={email} 
            onkeydown={handleEnter}
            placeholder="you@work.com" />

        {#if busy}
            <div class="spinner-sm"></div>
        {/if}

    </div>

    {#if invalid_email}
        <div class="mt-4 text-red-600 leading-6 text-sm">
            Please enter a valid email address.
        </div>
    {/if}


    {#if email_exists}
        <div class="mt-4 leading-6 text-sm">
            This email address is already in use.
        </div>
    {/if}

    {#if bad_email}
        <div class="mt-4 leading-6 text-red-600 text-sm">
            You'll need to use a different email address.
        </div>
    {/if}


    <div class="mt-6">
        <button 
            onclick={verify}
            class="bg-neutral-900 text-white px-2 w-full py-3 uppercase
            text-base font-medium" >
            Send code
        </button>
    </div>

</div>
{/if}


<style>
.spinner {
    position: absolute;
    top: 16px;
    right: 1rem;
}
</style>

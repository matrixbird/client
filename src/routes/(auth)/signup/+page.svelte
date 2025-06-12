<script>
import logo from '$lib/logo/logo'
import { onMount, tick } from 'svelte';
import VerifyEmail from './verify-email.svelte';
import CreateAccount from './create-account.svelte';


let { 
    data, 
} = $props();

$effect(() => {
    if(data) {
        console.log('data', data)
    }
})

let disabled = $derived.by(() => {
    return !data?.registration_enabled
})

let no_verification = $derived.by(() => {
    return !data?.require_verification
})

$effect(() => {
    //console.log(data)
})

let busy = $state(false);

let verified = $state(false);

let session = $state(null);

function setVerified(event) {
    if(event?.verified) {
        verified = true;
        session = {
            email: event.email,
            session: event.session,
            client_secret: event.client_secret,
        }
    }
}

</script>

<div class="box w-full flex flex-col" 
    class:bobble={busy}>

    {#if disabled}
        <div class="flex p-4 border-b border-border">
            <div class="flex items-center flex-1 font-medium">
                    Signups closed
            </div>

            <div class="flex place-items-center">
                <div class="w-[1.5rem] sm:w-[1.8rem]">
                    {@html logo}
                </div>
            </div>
        </div>
        <div class="content flex-1 flex flex-col p-4 mt-4 mb-6 leading-6">
            Signups are currently closed. Please try again later. If you have an
            invite code, you can still create an account.
        </div>

    {/if}

    {#if !disabled}
    <div class="flex p-4 border-b border-border">
        <div class="flex items-center flex-1 font-medium">
            Create an account
        </div>

        <div class="flex place-items-center">
            <div class="w-[1.5rem] sm:w-[1.8rem]">
                {@html logo}
            </div>
        </div>
    </div>
    {/if}

    {#if !verified && !disabled && !no_verification}
        <VerifyEmail {setVerified} />
    {/if}

    {#if verified || no_verification}
        <CreateAccount {session} {data} />
    {/if}

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

</style>

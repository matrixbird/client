<script>
import logo from '$lib/logo/logo.js'
import { onMount, tick } from 'svelte';
import VerifyEmail from './verify-email.svelte';
import CreateAccount from './create-account.svelte';


let { data } = $props();

let disabled = $derived.by(() => {
    return !data?.features?.registration_enabled
})

let no_verification = $derived.by(() => {
    return !data?.features?.require_verification
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
        <div class="flex p-4 box-title">
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
    <div class="flex p-4 box-title">
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

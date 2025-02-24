<script>
import logo from '../../../../logo.png'
import { onMount, tick } from 'svelte';



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


    <div class="flex p-4 box-title">
        <div class="flex items-center flex-1 font-medium">
            Create an account
        </div>

        <div class="">
            <a href="/" class="">
                <img src={logo} alt="logo" class="w-6 h-6" />
            </a>
        </div>
    </div>

    ok

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

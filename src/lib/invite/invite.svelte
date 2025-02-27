<script>
let toggled = $state(false);
let locked = $state(false);

let email_input;
let email = $state('');

function toggle() {
    if(email === '') {
        email_input.focus();
        return;
    }
    locked = true
    setTimeout(() => {
        toggled = !toggled;
    }, 1000);
}

</script>

<div class="flex items-center mt-10 h-[60px]">

{#if toggled}
    <div class="flex items-center underline">
        We'll let you know when your account is ready.
    </div>
{/if}

{#if !toggled}
    <div class="flex items-center gap-3">
        <div class="">
            <input 
                bind:this={email_input}
                bind:value={email}
                disabled={locked}
                type="email" 
                placeholder="you@work-email.com" 
                class="px-4 py-2 border border-bird-400 rounded-sm
                text-[14px] mono h-[36px] 
                focus:outline-none focus:border-bird-900 focus:ring-opacity-50" />
        </div>
        <div class="">
            <button 
                onclick={toggle}
                disabled={locked}
                class="bg-bird-800 text-white px-4 py-2 
                h-[36px]
                hover:bg-bird-700 uppercase">
                Request Invite
            </button>
        </div>
    </div>

{/if}

</div>

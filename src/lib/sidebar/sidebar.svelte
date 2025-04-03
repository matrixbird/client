<script>
import MailboxList from './mailbox-list.svelte'
import NewMessage from '$lib/editor/new-message.svelte'
import EmailRequests from './email-requests.svelte';

import Footer from '$lib/footer/footer.svelte';

import { createMatrixStore } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

import { ui_state } from '$lib/store/app.svelte'

const mobile = $derived(ui_state?.mobile)

let requests = $derived(store.requests)
</script>

<div class="flex flex-col w-full h-full p-2">

    {#if mobile}
        <div class="flex place-items-center mb-2">
            <span class="silk font-bold text-xl">
                Matrixbird
            </span>
        </div>
    {/if}

    {#if !mobile}
        <div class="flex place-items-center mb-2">
            <NewMessage />
        </div>
    {/if}

    {#if requests.length > 0}
        <EmailRequests />
    {/if}

    <div class="flex-1">
        <MailboxList />
    </div>

    <div class="">
    </div>

</div>

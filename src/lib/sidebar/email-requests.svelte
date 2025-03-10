<script>
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { email_requests } from '$lib/store/matrix.svelte.js'

function open() {
    goto(`/mail/requests`)
}

</script>

<div class="flex place-items-center mt-2 p-2 primary cursor-pointer">
    <span class="text-sm text-bird-800">Email Requests</span>
</div>

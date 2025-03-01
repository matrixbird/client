<script>
import DOMPurify from "dompurify";

import EmailView from "$lib/email-view/email-view.svelte";

import { page } from '$app/stores';


import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

const events = $derived(store?.events)

const email = $derived(events?.find(e => e.event_id === $page.params.event))

</script>


<div class="h-full overflow-x-auto overflow-y-auto select-text">
    {#if email}
        <EmailView {email} />
    {/if}
</div>

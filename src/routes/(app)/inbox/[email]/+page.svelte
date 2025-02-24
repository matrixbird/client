<script>
import DOMPurify from "dompurify";

import { page } from '$app/stores';


import { createStore } from '$lib/store/store.svelte.js'
const store = createStore()

const events = $derived(store?.events)

const email = $derived(events?.find(e => e.event_id === $page.params.email))

const body = $derived.by(() => {
    return email?.content?.body?.html ? email?.content?.body?.html :
        email?.content?.body?.text
})

const is_html = $derived.by(() => {
    return email?.content?.body?.html
})

let subject = $derived(email?.content?.subject || `(no subject)`)

let clean = $state(null);

$effect(() => {
    if(email) {
        DOMPurify.addHook('afterSanitizeAttributes', node => {
          if (node.tagName === 'A') {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
        });

        clean = DOMPurify.sanitize(body, {
            ADD_ATTR: ['target'],
        })
    }
})

</script>

{#if clean}
<div class="h-full overflow-x-auto overflow-y-auto">
    <div class="meta">
        <div class="">
            {subject}
        </div>
    </div>

    <div class="p-4">
        {@html clean}
    </div>

</div>
{/if}

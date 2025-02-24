<script>
import AttachmentItem from './attachment-item.svelte'
let { email } = $props();

const attachments = $derived.by(() => {
    return email?.content?.attachments
})

</script>

<div class="flex ml-20 gap-1 mb-2">
    {#each attachments as attachment}
        <AttachmentItem {attachment} />
    {/each}
</div>

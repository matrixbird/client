<script>
import ListHeader from './list-header.svelte'
import EmailItems from './email-items.svelte'
</script>

<div class="grid grid-rows-[auto_1fr] overflow-hidden">
    <ListHeader />
    <div class="items h-full overflow-y-auto overflow-x-hidden">
        <EmailItems />
    </div>
</div>

<style>
.items {
}
.items::-webkit-scrollbar-thumb {
}

.items:hover::-webkit-scrollbar-thumb {
}
</style>

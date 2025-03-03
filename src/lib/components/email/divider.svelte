<script>
let { emails, showEmails } = $props();

let count = $derived(emails?.length);
</script>

<div class="divider group cursor-pointer" onclick={showEmails}>
    <div class="divider relative h-1 mt-[-10px]">
        <div class="border border-bird-300 text-xs rounded-[500px] absolute
            group-hover:border-bird-400 group-hover:bg-bird-50 
            left-3 mt-[-2px] bg-background py-1 px-2">
            {count} more
        </div>
    </div>
    <div class="mt-2 h-3 border-t border-bird-200 cursor-pointer">
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
</style>


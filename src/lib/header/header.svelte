<script>
import Search from '$lib/search/search.svelte'
import { page } from '$app/stores';
import { createStore } from '$lib/store/store.svelte.js'
const store = createStore()

let title = $derived.by(() => {
    let str = $page.route.id.slice(7).split('/')[0];
    return `${str[0].toUpperCase()}${str.slice(1)}`;
})
</script>

<div class="flex border-b border-border p-2">
    <div class="flex place-items-center">
        <button class="primary py-2 px-3">New email</button>
    </div>
    <div class="ml-1 font-semibold flex-1 text-center">
    </div>
    <div class="flex place-items-center">
        <Search />
    </div>
</div>

<style lang="postcss">
@reference "tailwindcss/theme";
</style>


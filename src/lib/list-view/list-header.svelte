<script>
import Search from '$lib/search/search.svelte';
import { filter  } from '$lib/assets/icons';
</script>

<div class="flex border-b border-border py-1 pl-2 pr-2">
    <Search />
    <div class="">
    </div>

    <div class="flex place-items-center mr-1 cursor-pointer">
        {@html filter}
    </div>

</div>

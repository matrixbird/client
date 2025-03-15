<script>
import Search from '$lib/search/search.svelte';
import { filter  } from '$lib/assets/icons';
</script>

<div class="flex border-b border-border pl-1 pr-2">
    <Search />
    <div class="">
    </div>

    <div class="flex place-items-center mr-1 cursor-pointer">
        {@html filter}
    </div>

</div>

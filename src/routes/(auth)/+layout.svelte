<script lang="ts">
import { onMount } from 'svelte';
import '../../app.css';

let { children } = $props();

onMount(() => {
})

</script>


<div class="h-dvh w-full px-4 sm:px-6 lg:px-8 grid place-items-center
    select-none">


    <div class="w-full sm:w-[420px] min-h-[500px] flex flex-col">
        {@render children()}
    </div>


</div>

<style>
</style>

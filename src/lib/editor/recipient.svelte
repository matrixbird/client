<script>
import { onMount } from 'svelte';
import { close_small } from '$lib/assets/icons'
import { valid_email } from '$lib/appservice/api'

let { 
    item,
    to_focused,
    removeEmail
} = $props();

onMount(async() => {
    let resp = await valid_email(item.email);
    console.log(resp)
})

function remove(e) {
    removeEmail(item.email)
}

</script>

<div class="flex place-items-center my-2 px-2 mr-2
    hover:border-bird-500 duration-100
    border border-bird-400
    bg-bird-50 rounded cursor-pointer"
        onclick={remove}>
    <div class="">
        {item.email}
    </div>
    <div class="cursor-pointer font-semibold ml-1">
        {@html close_small}
    </div>
</div>


<style lang="postcss">
@reference "tailwindcss/theme";
</style>


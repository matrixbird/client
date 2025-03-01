<script>
import { close_small } from '$lib/assets/icons'

let { 
    email,
    to_focused,
    removeEmail
} = $props();
</script>

<div class="flex place-items-center my-2 px-2 mr-2
    hover:border-bird-500 duration-100
    border border-bird-400
    bg-bird-50 rounded cursor-pointer"
        onclick={() => removeEmail(email)}>
    <div class="">
        {email}
    </div>
    <div class="cursor-pointer font-semibold ml-1">
        {@html close_small}
    </div>
</div>


<style lang="postcss">
@reference "tailwindcss/theme";
</style>


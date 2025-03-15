<script>
import Logout from '$lib/auth/logout.svelte'
import { 
    mxid_to_email,
    get_localpart
} from '$lib/utils/matrix'
let { kill } = $props();
import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const matrix = createMatrixStore()

let user = $derived(matrix?.user)

let displayName = $derived.by(() => {
    if(user?.displayName) {
        return user?.displayName
    }
})

let email = $derived.by(() => {
    if(user?.userId) {
        return mxid_to_email(user.userId)
    }
})

</script>


<div class="menu grid grid-rows-[auto_1fr]">

    <div class="flex flex-col p-3 border-b border-border select-text">

        <div class="flex place-items-center text-base font-medium">
            {#if displayName}
                {displayName}
            {/if}
        </div>
        <div class="flex place-items-center text-sm mt-2">
            {#if email}
                {email}
            {/if}
        </div>
    </div>

    <div class="flex flex-col">
        <Logout />
    </div>
</div>


<style lang="postcss">
@reference "tailwindcss/theme";
.menu {
    min-width: 300px;
}
</style>

<script>
import { deleteAll } from '$lib/utils/indexedDB'

let form;

async function logout() {
    console.log('logging out')
    try {
        await deleteAll();
    } catch (error) {
        console.error('Error deleting all databases', error);
    }
    form.submit();
}

</script>

<div class="logout">
    <form bind:this={form} method="POST" action="/logout">
    </form>
    <button onclick={logout} class="p-3 flex items-center gap-2 text-neutral-600
        hover:text-neutral-900"> Log out
    </button>
</div>

<style>
.logout {
    position: fixed;
    bottom: 1rem;
    left: 1rem;
}
</style>

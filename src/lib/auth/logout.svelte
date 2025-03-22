<script>
import {
    goto,
} from '$app/navigation';
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
    goto('/logout')
    // sometimes goto doesn't work, fix later
    window.location.replace('/logout')
}

</script>

<form bind:this={form} method="POST" action="/logout">
</form>

<div onclick={logout} class="logout flex place-items-center px-3 py-2 
    hover:bg-bird-100 rounded-b-2xl
    gap-2 cursor-pointer">
    <div class="">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M4 20V4h8.02v1H5v14h7.02v1zm12.462-4.461l-.702-.72l2.319-2.319H9.192v-1h8.887l-2.32-2.32l.702-.718L20 12z"/></svg>
    </div>
    <div class="text-md">
        Log out
    </div>
</div>

<style>
</style>

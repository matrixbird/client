<script>
import '../app.css';
import { error } from '$lib/assets/icons'
import { page } from '$app/state';

let message = $derived.by(() => {
    return page.error.message || `Something went wrong...`
})

</script>


<div class="h-screen w-full grid place-items-center">
    <div class="flex flex-col text-center">
        <div class="text-4xl font-bold mono">
            🤖
        </div>
        <div class="pt-3 text-xl ">
            {message}
        </div>
    </div>
</div>

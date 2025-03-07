<script>
import { onMount } from 'svelte'
import { browser } from '$app/environment'

onMount(() => {
    if (browser) {
        setupKeyListener()
    }
})

function setupKeyListener() {
    window.addEventListener('keydown', function(event) {
        if(event.altKey || event.key == 'Alt') {
        }

        if (event.shiftKey && event.key.toLowerCase() === 'n') {
            //event.preventDefault();
            //console.log('Ctrl+N was pressed!');
            //return false;
        }
    });
}

</script>

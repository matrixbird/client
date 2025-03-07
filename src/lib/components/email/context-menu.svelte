<script>
import { browser } from '$app/environment';
import { onDestroy } from 'svelte';
import { get } from 'svelte/store';

import { 
    email_context_menu
} from '$lib/store/app.svelte.js'

let menuEl = $state(null);
let open = $state(false);

function handleClickOutside(event) {
    if (!open) return;

    const insideMenu = menuEl && menuEl.contains(event.target);
    
    if (!insideMenu) {
        kill();
    }
}

export function kill() {
    email_context_menu.email = null;
    email_context_menu.pos = null;
    open = false;
    cleanup();
}

let active = $derived.by(() => {
    return email_context_menu.email !== null &&
        email_context_menu.pos !== null;
})

let pos = $derived.by(() => {
    return email_context_menu?.pos;
})

let top = $derived.by(() => {
    return pos?.y + 2;
})

let left = $derived.by(() => {
    return pos?.x + 2;
})

$effect(() => {
    if(active && top && left) {
        open = true;
        //setTimeout(updatePosition, 100);
    }
})

$effect(() => {
    if(browser) {
        setup();
    }
});

function setup() {
    if (open) {
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('contextmenu', handleClickOutside);
            window.addEventListener('resize', kill);
            window.addEventListener('scroll', kill);
        }, 100);
    }
}

onDestroy(() => {
});

function cleanup() {
    if(browser) {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
        window.removeEventListener('resize', kill);
        window.removeEventListener('scroll', kill);
    }
}
</script>

{#if open}
    <div 
        class="context-menu"
        bind:this={menuEl}
        role="menu"
        aria-modal="true"
        style="--top:{top}px;--left:{left}px;"
    >
        <div class="context-menu-content p-4">
        </div>
    </div>
    <div class="mask" onclick={kill}>
    </div>
{/if}

<style lang="postcss">
@reference "tailwindcss/theme";

.context-menu-trigger {
    display: inline-block;
}

.context-menu {
    position: fixed;
    z-index: 10000;
    top: var(--top);
    left: var(--left);
    background: white;
    border: 1px solid var(--border);
    transform: translate(0, 0);
    border-radius: 4px;
    min-width: 150px;
    -webkit-box-shadow: 2px 0px 17px 0px rgba(0,0,0,0.23);
    -moz-box-shadow: 2px 0px 17px 0px rgba(0,0,0,0.23);
    box-shadow: 2px 0px 17px 0px rgba(0,0,0,0.23);
}

.context-menu-content {
    position: relative;
    z-index: 2;
}
</style>

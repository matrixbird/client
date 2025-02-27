<script>
import { browser } from '$app/environment';
import { onDestroy } from 'svelte';
import { get } from 'svelte/store';

import { 
    email_context_menu
} from '$lib/store/store.svelte.js'

let menuEl = $state(null);
let open = $state(false);

function updatePosition() {
    if (menuEl) {
        Object.assign(menuEl.style, {
            left: `${rect.x + 2}px`,
            top: `${rect.y + 2}px`,
        });
    }
}

function handleClickOutside(event) {
    if (!open) return;

    const insideMenu = menuEl && menuEl.contains(event.target);
    
    if (!insideMenu) {
        open = false;
    }
}

export function kill() {
    open = false;
}

let active = $derived.by(() => {
    return email_context_menu.email !== null &&
        email_context_menu.rect !== null;
})

let rect = $derived.by(() => {
    return email_context_menu?.rect;
})

$effect(() => {
    if(active && rect) {
        open = true;
        setTimeout(updatePosition, 100);
    }
})

$effect(() => {
    if(browser) {
        setup();
    }
});

function setup() {
    if (open) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('contextmenu', handleClickOutside);
        window.addEventListener('resize', kill);
        window.addEventListener('scroll', kill);
    } else {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
        window.removeEventListener('resize', kill);
        window.removeEventListener('scroll', kill);
    }
}

onDestroy(() => {
    if(browser) {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
        window.removeEventListener('resize', kill);
        window.removeEventListener('scroll', kill);
    }
});
</script>

{#if open}
    <div 
        class="context-menu"
        bind:this={menuEl}
        role="menu"
        aria-modal="true"
    >
        <div class="context-menu-content">
        </div>
    </div>
{/if}

<style lang="postcss">
@reference "tailwindcss/theme";

.context-menu-trigger {
    display: inline-block;
}

.context-menu {
    position: absolute;
    z-index: 10000;
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

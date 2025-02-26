<script>
import { browser } from '$app/environment';
import { onMount, onDestroy } from 'svelte';
import { 
    computePosition, 
    autoUpdate, 
    offset, 
    shift, 
    flip,
    arrow
} from '@floating-ui/dom';

let {
    trigger,
    content,
    placement = "right",
    offsetDistance = 8,
    showArrow = true,
    action = "click",
    hoverDelay = 300
} = $props();

let triggerEl = $state(null);
let popupEl = $state(null);
let arrowEl = $state(null);
let open = $state(false);
let hoverTimeout = $state(null);


let cleanup = null;

function updatePosition() {
    if (!triggerEl || !popupEl) return;

    if (cleanup) {
        cleanup();
        cleanup = null;
    }

    const middleware = [
        offset(offsetDistance),
        flip(),
        shift({ padding: 5 }),
    ];

    if (showArrow && arrowEl) {
        middleware.push(arrow({ element: arrowEl }));
    }

    computePosition(triggerEl, popupEl, {
        placement,
        middleware,
    }).then(({ x, y, placement, middlewareData }) => {
            if (popupEl) {
                Object.assign(popupEl.style, {
                    left: `${x}px`,
                    top: `${y}px`,
                });
            }

            if (showArrow && arrowEl && middlewareData?.arrow) {
                const { x: arrowX, y: arrowY } = middlewareData.arrow;
                const staticSide = {
                    top: 'bottom',
                    right: 'left',
                    bottom: 'top',
                    left: 'right',
                }[placement.split('-')[0]];

                Object.assign(arrowEl.style, {
                    left: arrowX != null ? `${arrowX}px` : '',
                    top: arrowY != null ? `${arrowY}px` : '',
                    right: '',
                    bottom: '',
                    [staticSide]: '-6px', 
                });
            }
        });

    cleanup = autoUpdate(triggerEl, popupEl, () => {
        computePosition(triggerEl, popupEl, {
            placement,
            middleware,
        }).then(({ x, y, placement, middlewareData }) => {
                if (popupEl) {
                    Object.assign(popupEl.style, {
                        left: `${x}px`,
                        top: `${y}px`,
                    });
                }

                if (showArrow && arrowEl && middlewareData?.arrow) {
                    const { x: arrowX, y: arrowY } = middlewareData.arrow;
                    const staticSide = {
                        top: 'bottom',
                        right: 'left',
                        bottom: 'top',
                        left: 'right',
                    }[placement.split('-')[0]];

                    Object.assign(arrowEl.style, {
                        left: arrowX != null ? `${arrowX}px` : '',
                        top: arrowY != null ? `${arrowY}px` : '',
                        right: '',
                        bottom: '',
                        [staticSide]: '-6px', // Position arrow outside the popup
                    });
                }
            });
    });
}

function handleClickOutside(event) {
    if (!open) return;

    const insidePopup = popupEl && popupEl.contains(event.target);
    const insideTrigger = triggerEl && triggerEl.contains(event.target);

    if (!insidePopup && !insideTrigger) {
        open = false;
    }
}

export function kill() {
    open = false;
}

function togglePopup() {
    if(action == 'click') {
        open = !open;
    }
}

function handleMouseEnter() {
    if (action === 'hover') {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
            open = true;
        }, hoverDelay);
    }
}

function handleMouseLeave() {
    if (action === 'hover') {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
            open = false;
        }, hoverDelay);
    }
}

function handlePopupMouseEnter() {
    if (action === 'hover') {
        clearTimeout(hoverTimeout);
    }
}

function handlePopupMouseLeave() {
    if (action === 'hover') {
        hoverTimeout = setTimeout(() => {
            open = false;
        }, hoverDelay);
    }
}

$effect(() => {
    if(browser) {
        setup();
    }
});

function setup() {
    if (open) {
        updatePosition();
        document.addEventListener('mousedown', handleClickOutside);
    } else {
        if (cleanup) {
            cleanup();
            cleanup = null;
        }
        document.removeEventListener('mousedown', handleClickOutside);
    }
}

onDestroy(() => {
    if (cleanup) {
        cleanup();
    }
    if(browser) {
        document.removeEventListener('mousedown', handleClickOutside);
    }
});

</script>




<div class="popup-trigger" bind:this={triggerEl} 
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    onclick={togglePopup}>
    {@render trigger()}
</div>

{#if open}
    <div 
        class="popup"
        bind:this={popupEl}
        role="dialog"
        aria-modal="true"
        onmouseenter={handlePopupMouseEnter}
        onmouseleave={handlePopupMouseLeave}
    >
        {@render content()}
        <div class="arrow" bind:this={arrowEl}></div>
    </div>
{/if}

<style>
.popup-trigger {
    display: inline-block;
    cursor: pointer;
}

.popup {
    position: absolute;
    z-index: 1000;
    background: white;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid #eaeaea;
    min-width: 180px;
}

.arrow {
    position: absolute;
    width: 12px;
    height: 12px;
    background: white;
    transform: rotate(45deg);
    border: 1px solid #eaeaea;
    z-index: -1;
}

</style>

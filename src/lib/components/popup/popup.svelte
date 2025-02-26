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
    toggle,
    trigger,
    content,
    mask,
    placement = "bottom-start",
    offsetDistance = 8,
    showArrow = false,
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

$effect(() => {
    toggle(open)
})

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


let br = $derived.by(() => {
    let isRight = placement.includes('right');
    return isRight ? 0 : 1;
})

let bl = $derived.by(() => {
    let isLeft = placement.includes('left');
    return isLeft ? 0 : 1;
})

let bt = $derived.by(() => {
    let isTop = placement.includes('top');
    return isTop ? 0 : 1;
})

let bb = $derived.by(() => {
    let isBottom = placement.includes('bottom');
    return isBottom ? 0 : 1;
})

</script>

{#if mask && open}
    <div class="mask" onclick={handleClickOutside}>
    </div>
{/if}



<div class="popup-trigger" bind:this={triggerEl} 
    onmouseenter={handleMouseEnter}
    onmouseleave={handleMouseLeave}
    onclick={togglePopup}>
    {@render trigger()}
</div>

{#if open}
    <div 
        class="popup"
        style="--br: {br}px;--bl: {bl}px;--bt: {bt}px;--bb: {bb}px;"
        bind:this={popupEl}
        role="dialog"
        aria-modal="true"
        onmouseenter={handlePopupMouseEnter}
        onmouseleave={handlePopupMouseLeave}
    >

        <div class="popup-content">
            {@render content()}
        </div>
        {#if showArrow}
            <div class="arrow" bind:this={arrowEl}></div>
        {/if}
    </div>
{/if}

<style lang="postcss">
@reference "tailwindcss/theme";
.popup-trigger {
    display: inline-block;
    cursor: pointer;
}

.popup {
    position: absolute;
    z-index: 10000;
    background: white;
    border: 1px solid var(--border);
    transform: translate(0, 0);
    border-radius: 1px;
    -webkit-box-shadow: 2px 0px 17px 0px rgba(0,0,0,0.23);
    -moz-box-shadow: 2px 0px 17px 0px rgba(0,0,0,0.23);
    box-shadow: 2px 0px 17px 0px rgba(0,0,0,0.23);
}

.popup:hover {
}


.popup-content {
    position: relative;
    z-index: 2;
}

.arrow {
    position: absolute;
    width: 12px;
    height: 12px;
    background: white;
    transform: rotate(45deg);
    border-right: var(--br) solid var(--border);
    border-left: var(--bl) solid var(--border);
    border-top: var(--bt) solid var(--border);
    border-bottom: var(--bb) solid var(--border);
    z-index: 1;
}

.mask {
    z-index: 99;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.4);
}

</style>

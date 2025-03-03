<script>
let {
    init,
    position
} = $props();

let width = $derived(init?.width)
let height = $derived(init?.height)
let top = $derived(position?.y || init?.top)
let left = $derived(position?.x || init?.left)

</script>

<div class="ghost"
    style="--width:{width}px;--height:{height}px;--top:{top}px;--left:{left}px;">
</div>

<style>
.ghost {
    position: fixed;
    pointer-events: none;
    z-index: 1000;
    border: 2px solid theme('colors.bird.700');
    width: var(--width);
    height: var(--height);
    top: var(--top);
    left: var(--left);
}
</style>

<script>
import { paperclip } from '$lib/assets/icons.js'
let { attachment } = $props();

const filename = $derived.by(() => {
    return attachment?.filename
})

function open(e) {
    e.stopPropagation()
}

</script>

<div class="flex text-sm rounded px-1 bg-neutral-100 border border-neutral-200
    cursor-pointer hover:bg-neutral-200"
onclick={open}>

    <div class="flex place-items-center mr-1">
        {@html paperclip}
    </div>
    <div class="flex place-items-center">
        {filename}
    </div>
</div>

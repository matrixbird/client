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

<div class="flex text-sm rounded px-1 bg-bird-100 border border-bird-200
    cursor-pointer hover:bg-bird-200"
onclick={open}>

    <div class="flex place-items-center mr-1">
        {@html paperclip}
    </div>
    <div class="flex place-items-center">
        {filename}
    </div>
</div>

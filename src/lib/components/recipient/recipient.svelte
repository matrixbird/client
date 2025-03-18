<script lang="ts">
import { 
    mxid_to_email
} from '$lib/utils/matrix'

let {
    recipient,
} = $props();

let email = $derived.by(() => {
    return mxid_to_email(recipient)
})

</script>

<span class="text-xs mr-1">
    {email}
</span>

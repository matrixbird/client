<script>

import { 
    mxid_to_email,
    get_localpart
} from '$lib/utils/matrix.js'

import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

let { email } = $props();

let user = $derived.by(() =>{
    if(!email?.room_id) return

    let users = store.client.getUsers()
    let user = users.find(user => user.userId == email.sender)

    if(user) {
        return {
            name: user?.name || user?.rawDisplayName,
            address: mxid_to_email(user.userId),
            localpart: get_localpart(user.userId)
        }
    }
})

</script>

<div class="flex place-items-center">
    <div class="text-sm bg-bird-700 w-6 h-6 
        hover:bg-white hover:border-4 hover:border-bird-700
        rounded-[50%]">
    </div>
</div>

<script>
import { createStore } from '$lib/store/store.svelte.js'

const store = createStore()

let user = $derived.by(() => {
    if(!store?.synced) return null
    let user = store.client.store.getUser(store.client.getUserId())
    if(user) {
        return user
    }
})

let local_part = $derived.by(() => {
    if(!store?.synced) return null
    let localPart = store.client.getUserIdLocalpart()
    if(localPart) {
        return localPart
    }
})

let displayName = $derived.by(() => {
    if (user?.displayName) {
        return user?.displayName
    }
})

let initials = $derived.by(() => {
    if(displayName) {
        return displayName[0]
    }
    if(local_part) {
        return local_part[0]
    }
})


</script>

<div class="grid place-items-center w-full mb-2">
    <div class="user rounded-[50%] w-9 h-9 cursor-pointer
        hover:bg-neutral-800 grid place-items-center 
        bg-neutral-900" >
        <div class="font-semibold text-white ">
            {initials} 
        </div>
    </div>
</div>

<style>
.user {
}
</style>

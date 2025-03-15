<script>

import { 
    mxid_to_email,
    get_localpart,
    get_email_localpart
} from '$lib/utils/matrix'

import { 
    create_initials
} from '$lib/utils/string'

import {
    getThumbnail,
} from '$lib/matrix/api.js'

import { createMatrixStore } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

let { 
    user_id, 
    from,
    small = false ,
    large = false 
} = $props();

let user = $derived.by(() =>{
    let users = store.client.getUsers()
    let user = users.find(user => user.userId == user_id)
    if(user) {
        return {
            name: user?.name || user?.rawDisplayName,
            avatar_url: user?.avatarUrl,
            address: mxid_to_email(user.userId),
            localpart: get_localpart(user.userId)
        }
    }
})

let initials = $derived.by(() => {
    if(from?.name) {
        return create_initials(from.name)
    }
    if(from?.address) {
        let localpart = get_email_localpart(from.address)
        return create_initials(localpart)
    }
    return user?.name ? create_initials(user.name) :
    create_initials(user?.localpart)
})

let squeeze = $derived.by(() => {
    return initials?.length > 1
})

let avatar = $derived.by(() => {
    return user?.avatar_url
})

let is_matrixbird = $derived.by(() => {
    return get_localpart(user_id) == "matrixbird"
})

$effect(() => {
    if(avatar && !from) {
        getAvatar()
    }
})

let url = $state(null);

async function getAvatar() {
    let con = await getThumbnail(store.session.access_token, avatar)
    if(con) {
        url = con
    }
}


</script>

<div class="grid place-items-center text-xs bg-bird-700 rounded-[50%] pointer-events-none"
    class:w-9={large}
    class:h-9={large}
    class:w-7={!small && !large}
    class:h-7={!small && !large}
    class:w-4={small}
    class:h-4={small}>
    <div class="font-semibold text-white uppercase"
    class:text-[11px]={squeeze}
    class:tracking-wide={squeeze}>
        {#if !avatar} 
            {initials} 
        {/if}
        {#if avatar && url}
            <img src={url} class="" />
        {/if}
    </div>
</div>
<style lang="postcss">
@reference "tailwindcss/theme";
img {
    border-radius: 50%;
}
</style>


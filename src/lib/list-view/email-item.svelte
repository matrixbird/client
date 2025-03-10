<script>
import { goto } from '$app/navigation';
import { page } from '$app/stores';

import { 
    mxid_to_email,
    get_localpart
} from '$lib/utils/matrix.js'

import { 
    get_first_line
} from '$lib/utils/string.js'

import Date from '$lib/components/date/date.svelte'
import AttchmentItems from './attachments/attachment-items.svelte'

import UserAvatar from '$lib/user/avatar.svelte'

import { 
    check_small
} from '$lib/assets/icons.js'

import { 
    route_state,
    email_context_menu
} from '$lib/store/app.svelte.js'

import { createMatrixStore } from '$lib/store/matrix.svelte.js'

import { app } from '$lib/store/app.svelte.js'

const store = createMatrixStore()
const events = $derived(store?.events)
const threads = $derived(store?.threads)
const thread_events = $derived(store?.thread_events)

let { email } = $props();

let started_at = $derived(app.started_at)

let is_new = $derived.by(() => {
    if(!email) return
    if(active) return
    if(last_email_in_thread?.sender != store.user.userId) {
        return last_email_in_thread.origin_server_ts > started_at
    }
    return email.origin_server_ts > started_at
})

let replies = $derived.by(() => {
    let count = 0
    for (const event of events.values()) {
        if(event.content["m.relates_to"]?.event_id == email.event_id) {
            count++
        }
    }
    return count
})


let last_email_in_thread = $derived.by(() => {
    let emails = []
    for (const event of events.values()) {
        if(event.content["m.relates_to"]?.event_id == email.event_id) {
            emails.push(event)
        }
    }

    if(emails.length > 0) {
        return emails[emails.length - 1]
    }
    return email
})

let which_email = $derived.by(() => {
    if(last_email_in_thread) {

        return last_email_in_thread
    }
    return email
})


let is_thread_child = $derived.by(() => {
    return email?.content?.["m.relates_to"]?.["rel_type"] == "m.thread"
})

//let subject = $derived(email?.content?.subject || "no subject")
let subject = $derived.by(() => {
    if(is_thread_child && email?.content?.subject) {
        return `Re: ${email?.content?.subject}`
    }
    return email?.content?.subject || "no subject"
})

let name = $derived.by(() => {
    return email?.content?.from?.name
})

let address = $derived.by(() => {
    return email?.content?.from?.address
})

const native = $derived.by(() => {
    return email?.type == "matrixbird.email.matrix"
})

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

let is_matrixbird = $derived.by(() => {
    return get_localpart(email?.sender) == "matrixbird"
})


let first_line = $derived.by(() => {
    return get_first_line(email?.content?.body?.html)
})


function open(e) {
    if(e.ctrlKey) {
        //console.log(events.get(email.event_id))
        console.log($state.snapshot(email))
        return
    }
    const mailbox = $page.params.mailbox


    goto(`/mail/${mailbox}/${email.event_id}`)
}

function log(e) {
    email_context_menu.email = email
    email_context_menu.pos = {
        x: e.clientX,
        y: e.clientY,
    }
    email_context_menu.element = el
    e.preventDefault()
}

let selected = $state(false);

function select(e) {
    e.preventDefault()
    e.stopPropagation()
    selected = !selected
}

function selectEmail(e) {
    e.stopPropagation()
    selected = !selected
}

const active = $derived.by(() => {
    // mark active if this is a root thread and the params event_id 
    // matches this event's event_id
    let is_root_thread = email?.content?.["m.relates_to"] === undefined
    if(is_root_thread) {
        return $page.params.event === email.event_id
    }

    // if this is a thread event, we'll see if any sibling events 
    // match the params event_id
    let is_thread_child = email?.content?.["m.relates_to"]?.["rel_type"] ==
        "m.thread"

    if(is_thread_child) {
        let thread_id = email?.content?.["m.relates_to"]?.["event_id"]

        if(thread_id == $page.params.event) {
            return true
        }

        let children = thread_events.get(thread_id)
        if(children) {
            return children.some(event => event.event_id == $page.params.event)
        }
    }

    return $page.params.event === email.event_id
})

const has_attachments = $derived.by(() => {
    return email?.content?.attachments?.length > 0
})

$effect(() => {
    if(active) {
        route_state.mail = $page.url.pathname
    }

    if(email) {
        let user = store.user;
        let room = store.client.getRoom(email.room_id)
        //let read = room?.getReadReceiptForUserId(user.userId)
        //console.log('read', read)

        //let sendread = store.client.sendReadReceipt(email.room_id,
        //email.event_id)

        //markRead()
    }

})

async function markRead() {
    let room = store.client.getRoom(email.room_id)
    let event = room.getLiveTimeline().getEvents().find(event => event.event.event_id == email.event_id)

    let read = await store.client.sendReceipt(event, "m.read")
    console.log('read', read)
}

let el;


</script>


<div bind:this={el} class="email-item flex flex-col cursor-pointer hover:bg-bird-50 border-b
    border-bird-300 overflow-x-hidden"
    oncontextmenu={log}
    class:active={active}
    class:inactive={!active}
    onclick={open}>

    <div class="flex p-2 ml-2 overflow-x-hidden">

        <div class="flex flex-col flex-1 overflow-x-hidden">
            <div class="flex place-items-center leading-normal">

                <div class="text-md whitespace-nowrap">
                    {subject}
                </div>
                <div class="ml-2 text-sm text-light whitespace-nowrap overflow-hidden text-ellipsis">
                    {#if first_line}
                        {first_line}
                    {/if}
                </div>
            </div>
            <div class="mt-1">

                {#if native && is_matrixbird}
                    <div class="text-xs font-medium flex place-items-center">
                        <span class="mr-2 bg-bird-700 text-white px-1
                            rounded-[3px]">
                            Matrixbird
                        </span>
                        {@html check_small}
                    </div>
                {:else if native && user}
                    <div class="text-sm flex place-items-center">
                        <span class="mr-2">{user?.name}</span>
                        {@html check_small}
                    </div>
                {/if}

                {#if !native}
                    <div class="text-sm flex place-items-center">
                        {#if name}
                            <span class="mr-2">{name}</span>
                        {/if}
                            <span class="text-xs text-bird-800">&lt;{address}&gt;</span>
                    </div>
                {/if}




            </div>
        </div>

            {#if replies}
                <div class="">
                    {replies} replies
                </div>
            {/if}


        <div class="flex flex-col ml-4">
            <div class="text-[12px] text-bird-800">
                <Date event={email} />
            </div>

        </div>

    </div>

    {#if is_new}
    {/if}

    {#if has_attachments}
        <AttchmentItems {email} />
    {/if}

</div>








<style lang="postcss">
@reference "tailwindcss/theme";
.email-item {
}
.active {
    border-left: 3px solid theme('colors.bird.700');
}

.inactive {
    border-left: 3px solid transparent;
}
</style>



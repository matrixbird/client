<script>
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';

import { 
    mxid_to_email,
    get_localpart
} from '$lib/utils/matrix'

import { 
    downloadContent,
    sendReadReceipt
} from '$lib/matrix/api'

import { 
    get_first_line
} from '$lib/utils/string'

import EmailDate from '$lib/components/date/date.svelte'
import AttchmentItems from './attachments/attachment-items.svelte'

import UserAvatar from '$lib/user/avatar.svelte'

import { 
    check_small
} from '$lib/assets/icons.js'

import { 
    route_state,
    email_context_menu
} from '$lib/store/app.svelte'

import { 
    createMatrixStore, 
    large_email_content ,
    sync_state
} from '$lib/store/matrix.svelte'

import { app } from '$lib/store/app.svelte'

const store = createMatrixStore()
const events = $derived(store?.events)
const read_events = $derived(store?.read_events)
const threads = $derived(store?.threads)
const thread_events = $derived(store?.thread_events)

let { email } = $props();

let replies = $derived.by(() => {
    let count = 0

    if(email?.content?.["m.relates_to"]?.["rel_type"] == "m.thread") {
        let thread_id = email?.content?.["m.relates_to"]?.["event_id"]
        let _thread = threads.get(thread_id)
        let _thread_events = thread_events.get(thread_id)
        return _thread_events.length + 1
    }

    for (const event of events.values()) {
        if(event.type != "matrixbird.receipt" && event.content["m.relates_to"]?.event_id == email.event_id) {
            count++
        }
    }
    return count
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
    return email?.type == "matrixbird.email.matrix" ||
        email?.type == "matrixbird.email.reply"
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
    if(is_large && content) {
        return get_first_line(content)
    } else {
        return get_first_line(email?.content?.body?.html)
    }
})


let mailbox = $derived.by(() => {
    return page.params.mailbox
})

function open(e) {
    if(e.ctrlKey) {
        //console.log(events.get(email.event_id))
        console.log($state.snapshot(email))
        return
    }
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
        return page.params.event === email.event_id
    }

    // if this is a thread event, we'll see if any sibling events 
    // match the params event_id
    let is_thread_child = email?.content?.["m.relates_to"]?.["rel_type"] ==
        "m.thread"

    if(is_thread_child) {
        let thread_id = email?.content?.["m.relates_to"]?.["event_id"]

        if(thread_id == page.params.event) {
            return true
        }

        let children = thread_events.get(thread_id)
        if(children) {
            return children.some(event => event.event_id == page.params.event)
        }
    }

    return page.params.event === email.event_id
})

const has_attachments = $derived.by(() => {
    return email?.content?.attachments?.length > 0
})

$effect(() => {
    if(active) {
        route_state[mailbox] = page.url.pathname
    }

    if(email && active && !read) {
        markRead()
    }

})

let read = $state(true);

let read_event = $derived.by(() => {
    return read_events.get(email.event_id)
})

$effect(() => {
    if(!read_event) {
        read = false
    }
})

let thread_id = $derived.by(() => {
    let relation = email?.content?.["m.relates_to"]?.["event_id"]
    if(relation) {
        return relation
    }
    if(email?.unsigned?.["m.relations"]?.["m.thread"]) {
        return email?.event_id
    }
    return email?.event_id
})

let event_to_read = $derived.by(() => {
    let relation = email?.content?.["m.relates_to"]?.["event_id"]
    if(relation) {
        return relation
    }
    if(email?.unsigned?.["m.relations"]?.["m.thread"]) {
        return email?.event_id
    }
    return email?.event_id
})

async function markRead() {

    read = true

    await sendReadReceipt(
        store.session.access_token, 
        email.room_id, 
        email.event_id,
        {
            thread_id: thread_id
        }
    )

}

let last_sync = $derived(sync_state.last_sync)

let is_large = $derived.by(() => {
    return email?.content?.body?.content_uri != undefined
})

let content_uri = $derived.by(() => {
    return email?.content?.body?.content_uri
})

let is_new = $state(false);

onMount (() => {
    if(email.origin_server_ts > last_sync) {
        is_new = true
        setTimeout(() => {
            is_new = false
        }, 5000)
    }
    if(is_large && access_token) {
        console.log('large', email)
        fetchContent()
    }
})

let access_token = $derived.by(() => {
    return store.session.access_token
})

let content = $state(null)

async function fetchContent() {
    let _content = await downloadContent(access_token, content_uri)
    if(_content) {
        content = _content
        large_email_content.set(email.event_id, _content)
    }
}

let el;


</script>


<div bind:this={el} class="email-item flex flex-col cursor-pointer hover:bg-bird-50 overflow-x-hidden"
    oncontextmenu={log}
    class:active={active}
    class:inactive={!active}
    title={email.event_id}
    onclick={open}>

    <div class="flex p-2 overflow-x-hidden mr-2">

        <div class="flex mr-3 mt-1">
            <UserAvatar user_id={email.sender} 
                from={!native ? email?.content?.from : null}/>
        </div>

        <div class="flex flex-col flex-1 overflow-x-hidden">
            <div class="flex place-items-center leading-normal">

                <div class="subject whitespace-nowrap overflow-hidden
                    text-ellipsis flex-1"
                class:font-semibold={!read}>
                    {subject}
                </div>



                <div class="flex flex-col ml-2">
                    <div class="text-[12px] text-bird-800"
                        class:font-semibold={!read}>
                        <EmailDate event={email} />
                    </div>
                </div>

            </div>
            <div class="flex mt-1">

                {#if native && is_matrixbird}
                    <div class="text-xs font-medium flex place-items-center">
                        <span class="mr-2 bg-bird-700 text-white px-1
                            rounded-[3px]">
                            Matrixbird
                        </span>
                    </div>

                {:else if native && user}
                    <div class="text-sm flex place-items-center">
                        <span class="mr-2"
                        class:font-medium={!read}>
                            {user?.name}
                        </span>
                    </div>
                {/if}

                {#if !native}
                    <div class="text-sm flex place-items-center">
                        {#if name}
                            <span class="mr-2">{name}</span>
                        {/if}
                            <span class="text-light">&lt;{address}&gt;</span>
                    </div>
                {/if}

            {#if replies > 1}
                <div class="flex place-items-center">
                    <div class="text-xs font-medium text-light 
                            bg-bird-700 text-white
                            rounded px-1 ">
                        {replies} 
                    </div>
                </div>
            {/if}

                <div class="flex-1 ml-2 mr-12 text-sm text-light whitespace-nowrap overflow-hidden text-ellipsis">
                    {#if first_line}
                        {first_line}
                    {/if}
                </div>

                {#if is_new}
                <div class="flex place-items-center mr-2">
                    <div class="text-xs font-bold rounded bg-blue-700 px-1 text-white">
                        New
                    </div>
                </div>
                {/if}

                {#if !read}
                <div class="flex place-items-center">
                    <div class="h-2 w-2 rounded-[50%] bg-green-600">
                    </div>
                </div>
                {/if}


            </div>
        </div>

    </div>


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



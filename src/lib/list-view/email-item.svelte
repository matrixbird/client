<script>
import { goto } from '$app/navigation';
import { page } from '$app/stores';

import { 
    mxid_to_email,
    get_localpart
} from '$lib/utils/matrix.js'

import Date from '$lib/components/date/date.svelte'
import AttchmentItems from './attachments/attachment-items.svelte'

import { 
    lock_closed,
    check_small
} from '$lib/assets/icons.js'

import { 
    route_state,
    email_context_menu
} from '$lib/store/store.svelte.js'

import { createMatrixStore } from '$lib/store/matrix.svelte.js'
const store = createMatrixStore()

let { email } = $props();

let subject = $derived(email?.content?.subject || "no subject")

let name = $derived.by(() => {
    return email?.content?.from?.name
})

let address = $derived.by(() => {
    return email?.content?.from?.address
})

const native = $derived.by(() => {
    return email?.type == "matrixbird.email.native"
})

let user = $derived.by(() =>{
    if(!email?.room_id) return
    const room = store.rooms[email?.room_id]
    if(room) {
        const member = room.getMember(email.sender)
        //console.log(member)
        if(member) {
            return {
                name: member?.name || member?.rawDisplayName,
                address: mxid_to_email(member.userId),
                localpart: get_localpart(member.userId)
            }
        }
    }
})

let is_matrixbird = $derived.by(() => {
    return get_localpart(email.sender) == "matrixbird"
})


function open() {
    const mailbox = $page.params.mailbox
    goto(`/mail/${mailbox}/${email.event_id}`)
}

function log(e) {
    let rect = e.target.getBoundingClientRect()

    email_context_menu.email = email
    email_context_menu.pos = {
        x: e.clientX,
        y: e.clientY,
    }
    email_context_menu.element = el

    e.preventDefault()
    //console.log(email)
}

let selected = $state(false);

function select(e) {
    e.preventDefault()
    e.stopPropagation()
    console.log("lol")
    selected = !selected
}

function selectEmail(e) {
    e.stopPropagation()
    selected = !selected
}

const active = $derived.by(() => {
    return $page.params.event === email.event_id
})

const has_attachments = $derived.by(() => {
    return email?.content?.attachments?.length > 0
})

$effect(() => {
    if(active) {
        route_state.mail = $page.url.pathname
    }

})

let el;

</script>


<div bind:this={el} class="email-item flex flex-col cursor-pointer hover:bg-neutral-50 border-b
    border-neutral-300 overflow-x-hidden"
    oncontextmenu={log}
    class:active={active}
    class:inactive={!active}
    onclick={open}>

    <div class="flex p-3 overflow-x-hidden">

        <div class="flex place-items-center mr-3">
            <input type="checkbox" class="w-4 h-4" 
                onclick={selectEmail}
                checked={selected} />
        </div>

        <div class="flex place-items-center">
            <div class="text-sm bg-neutral-700 w-8 h-8 
                hover:bg-white hover:border-4 hover:border-neutral-700
                rounded-[50%]"
            onclick={select}>
            </div>
        </div>

        <div class="flex flex-col flex-1 ml-4 overflow-x-hidden">
            <div class="leading-normal whitespace-nowrap overflow-hidden text-ellipsis">
                {subject}
            </div>
            <div class="mt-1">

                {#if native && is_matrixbird}
                    <div class="text-xs font-medium flex place-items-center">
                        <span class="mr-2 bg-neutral-700 text-white px-1
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
                            <span class="text-xs text-neutral-800">&lt;{address}&gt;</span>
                    </div>
                {/if}


            </div>
        </div>


        <div class="flex flex-col ml-4">
            <div class="text-[12px] text-neutral-800">
                <Date event={email} />
            </div>

            {#if native}
                <div class="grid place-items-end mt-2">
                    {@html lock_closed}
                </div>
            {/if}

        </div>

    </div>

    {#if has_attachments}
        <AttchmentItems {email} />
    {/if}

</div>








<style lang="postcss">
@reference "tailwindcss/theme";
.email-item {
    min-height: 72px;
}
.active {
    border-left: 3px solid theme('colors.neutral.700');
}

.inactive {
    border-left: 3px solid transparent;
}
</style>



<script lang="ts">
import * as sdk from 'matrix-js-sdk/src/index';
import { PUBLIC_HOMESERVER } from '$env/static/public';
import logo from '$lib/logo/logo'
import { onMount, tick } from 'svelte';
import UploadAvatar from '$lib/user/upload-avatar.svelte';

import {
    goto,
} from '$app/navigation';

import { createMatrixStore } from '$lib/store/matrix.svelte'
const store = createMatrixStore()

type Props = {
    data: {
        access_token: string,
        device_id: string,
        user_id: string,
    }
}

let { 
    data
}: Props = $props();

$effect(() => {
})

onMount(() => {
    if(nameInput) {
        nameInput.focus();
    }
    if(data) {
        //store.updateSession(data)
        setTimeout(() => {
            //store.createMatrixClient(data)
        }, 1000)
        sync(data)
    }
});

let mailbox_rooms_ready = $state(false);
let event_count = $state(0);

async function sync(data) {
    console.log('syncing with data', data)
    let client =  sdk.createClient({
        baseUrl: PUBLIC_HOMESERVER,
        accessToken: data.access_token,
        userId: data.user_id,
        deviceId: data.device_id,
    });

    client.on(sdk.ClientEvent.AccountData, function (event) {
        if(event?.event?.type == "matrixbird.mailbox.rooms") {
            mailbox_rooms_ready = true
            //store.createMatrixClient(data)
        }
    });
    client.on(sdk.RoomEvent.Timeline, function (event, room) {
        if(event?.event?.type == "matrixbird.email.matrix") {
            event_count = event_count + 1
        }
    });
    let filter = sdk.Filter.fromJson(null, "test", {
        account_data: {
            types: ["matrixbird.mailbox.rooms"],
            limit: 1,
        },
    })
    await client.startClient({
        filter: filter,
        initialSyncLimit: 100,
        lazyLoadMembers: true,
    });
}

let synced = $state(false);

$effect(() => {
    if(!synced && mailbox_rooms_ready && event_count > 1) {
        synced = true
        setTimeout(() => {
            store.createMatrixClient(data)
        }, 1000)
    }
})


let busy = $state(false);

function startClient() {
    store.createMatrixClient(data)
}

async function goHome() {
    await store.createMatrixClient(data)
    goto('/mail/inbox')
}

let nameInput: HTMLInputElement | null = null;
let name: string = $state('');

async function save() {
    if(nameInput && name == '') {
        nameInput.focus();
        return;
    }
    busy = true
    await store.createMatrixClient(data)
    let resp = await store.client.setDisplayName(name);
    console.log(resp)
    /*
    if(avatar_url) {
        await store.client.setAvatarUrl(avatar_url);
    }
    */
    goto('/mail/inbox')
}

function handleKeydown(event: KeyboardEvent) {
    if(nameInput && name == '') {
        nameInput.focus();
        return;
    }
    if(event.key === 'Enter') {
        save()
    }
}

let avatar_url: string | null = $state(null);

function setAvatarUrl(url: string) {
    console.log("url is", url)
    avatar_url = url
}

</script>

<div class="box w-full flex flex-col" 
    class:bobble={busy}>

    <div class="flex p-4 box-title">
        <div class="flex items-center flex-1 font-medium">
            Your profile
        </div>

        <div class="flex place-items-center">
            <div class="w-[1.5rem] sm:w-[1.8rem]">
                {@html logo}
            </div>
        </div>
    </div>

    <div class="content flex-1 flex flex-col p-4 ">
        <div class="flex justify-center mt-2">
            <UploadAvatar {setAvatarUrl} />
        </div>
        <div class="mt-4">
            <input 
                class="py-3 pl-3 pr-[164px]"
                bind:this={nameInput} 
                bind:value={name} 
                disabled={busy}
                onkeydown={handleKeydown}
                type="text" 
                placeholder="Choose a name" />
        </div>

        <div class="mt-4">
            <button class="primary py-4 w-full" 
                disabled={busy}
                onclick={save}>
                {busy ? 'Saving...' : 'Finish'}
            </button>
        </div>
        <div class="mt-3 text-center">
            <span onclick={goHome}
                class="text-md text-bird-800 hover:underline cursor-pointer">
                Skip for now
            </span>
        </div>
    </div>

</div>


<style>

.box-title {
    border-bottom: 1px solid #dadada;
}


@keyframes bobble {
0%, 100% {
    transform: translateY(0);
    box-shadow: 6px 6px 0 #a7a7a729;
}
50% {
    transform: translateY(-10px);
    box-shadow: 10px 10px 0 #4b4b4b29;
}
}

.bobble {
    animation: bobble 0.6s ease-in-out infinite;
}

</style>

import { PUBLIC_HOMESERVER } from '$env/static/public';
import { MatrixClient } from 'matrix-js-sdk/src/index';
import type { User } from 'matrix-js-sdk/src/models/user';
import type { WhoamiResponse } from '$lib/types/matrix'
import { 
    SlidingSync, 
    type MSC3575List,
    type MSC3575Filter,
    type MSC3575RoomSubscription,
} from 'matrix-js-sdk/src/sliding-sync';

import type { ClientUISettings, MailboxRooms } from '$lib/types/matrixbird'

import * as sdk from 'matrix-js-sdk/src/index';
import { SvelteMap } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { untrack } from 'svelte';

import { session, updateSession, sessionExists, type Session } from '$lib/store/session.svelte';

import type {
    EmailRoomCreationResponse,
    Drafts,
    Threads,
    ThreadEvents
} from '$lib/types/matrixbird';

import { updateAppStatus, ui_state } from '$lib/store/app.svelte';

import { 
    process,
    processNewEmail,
    processNewEmailReply,
    processNewEmailRoom,
    processMailboxRooms,
    buildInboxEmails,
    buildDraftEmails,
    buildSentEmails,
} from '$lib/store/process.svelte'

import { v4 as uuidv4 } from 'uuid';

import {
    getThreadRootEvent,
    getThreadEvents,
} from '$lib/matrix/api'


let conn_id: string = $state(uuidv4());

let ready = $state(false);
let synced = $state(false);

let user: User | null = $state(null);

let nextSyncToken = $state(null);

let client: MatrixClient = $state(sdk.createClient({
    baseUrl: PUBLIC_HOMESERVER,
}));


export let rooms = $state({});
export let users = $state(new SvelteMap());


export let events = $state(new SvelteMap());
export let threads: Threads = $state(new SvelteMap());
(globalThis as any).threads = threads;
export let thread_events: ThreadEvents = $state(new SvelteMap());
(globalThis as any).thread_events = thread_events;

export let drafts: Drafts = $state([]);

export let read_events = $state(new SvelteMap());

export let store = $state({
    rooms: new SvelteMap(),
    users: new SvelteMap(),
    events: new SvelteMap(),
    threads: new SvelteMap(),
    thread_events: new SvelteMap(),
})

export let email_requests = $state([]);

export let large_email_content = $state(new SvelteMap());

export let media_cache = $state(new SvelteMap());


let joined_rooms: string[] = $state([]);

export let status = $state({
    events_ready: false,
    threads_ready: false,
    inbox_ready: false,
    sent_ready: false,
    thread_events_ready: false,
});


export let sync_state: {
    started: number,
    synced: boolean,
    state: string | null,
    last_sync: number | null,
    last_retry: number | null,
} = $state({
    started: Date.now(),
    synced: false,
    state: null,
    last_sync: null,
    last_retry: null,
});

let requests = $derived.by(() =>{
    return email_requests;
})

let processed = $state(false);

export function syncProcessed() {
    processed = true;
}

let inbox_items = $derived.by(() =>{
    if(!processed) {
        return []
    }
    return buildInboxEmails(session, threads, thread_events);
})

let sent_items = $derived.by(() =>{
    if(!status.threads_ready || !status.thread_events_ready) {
        return []
    }
    return buildSentEmails(session, threads, thread_events);
})

let draft_items = $derived.by(() =>{
    if(!status.threads_ready || !status.thread_events_ready) {
        return []
    }
    return buildDraftEmails(drafts);
})

export let mailbox_rooms: MailboxRooms = $state({});

let drafts_mailbox = $derived.by(() => {
    return mailbox_rooms["DRAFTS"];
})

let pending_emails_event = $state(null);


$effect.root(() => {
    $effect(() => {
        if(sessionExists()) {
            //console.log("We have session", session)
        }
        if(!ready && processed && synced) {
            status.threads_ready = true;
            status.thread_events_ready = true;
            ready = true;
        }
        if(ready && !drafts_mailbox) {
            setTimeout(() => {
                //createDraftsMailboxRoom()
            }, 2000)
        }
    })
})


export function createMatrixStore() {

    async function createMatrixClient(opts: Session) {

        if(!opts?.access_token || !opts?.user_id || !opts?.device_id) {
            console.error("No session provided.")
            return;
        }

        if(sessionExists()) {
            console.info("Session already exists.")
            //return;
        }

        if(!sessionExists()) {
            updateSession(opts)
        }

        if(client.clientRunning == true) {
            console.info("Client already running.")
            return;
        }


        console.info("Creating matrix client.", opts)
        updateAppStatus("Connecting...")

        /*
        let store_opts = { indexedDB: window.indexedDB, localStorage: window.localStorage };
        let store = new sdk.IndexedDBStore(store_opts);
        */


        client =  sdk.createClient({
            baseUrl: session.home_server,
            accessToken: session.access_token,
            userId: session.user_id,
            deviceId: session.device_id,
            //store: store,
            timelineSupport: true,
            supportsCallTransfer: false,
            useE2eForGroupCall: false
        });

        try {
            const whoami: WhoamiResponse  = await client.whoami()
            console.log(whoami);
            updateAppStatus("Verified user.")
        } catch(e: any) {
            if(e.errcode === "M_UNKNOWN_TOKEN") {
                console.warn("Invalid access token. Logging out.")
                //goto('/logout')
                window.location.href = '/logout'
                return
            }
        }

        console.log("Sync started at", sync_state.started)


        client.on(sdk.RoomStateEvent.NewMember, function (event, state, member) {
            //if(!synced) return;
            if(member.userId !== session.user_id) {
                //console.log("new member", event, state, member)
            }
        });


        client.on(sdk.RoomEvent.MyMembership, function (room, membership, prev) {

            if(!synced) return;

            if (membership === sdk.KnownMembership.Join) {
                processNewEmailRoom(client, room.roomId);
            }

        });

        client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
            if (event.event.type == "m.room.create" && event.event.sender === session.user_id) {
                let origin_server_ts = event.event.origin_server_ts
                if(origin_server_ts > sync_state.started) {
                    setTimeout(() => {
                        //console.log("I created this room. Should add.")
                        //processNewEmailRoom(client, room.roomId);
                    }, 3000)
                }
            }
        });


        client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
            if (event.event.type == "matrixbird.email.reply") {
                let origin_server_ts = event.event.origin_server_ts
                if(origin_server_ts > sync_state.started) {
                    processNewEmailReply(event)
                }
            }
        });

        client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
            if(!synced) return;

            if(event.event.type === "matrixbird.email.matrix" || 
            event.event.type === "matrixbird.email.standard") {

                let origin_server_ts = event.event.origin_server_ts
                if(origin_server_ts > sync_state.started) {
                    processNewEmail(event)
                }

            }

            if(event.event.type === "matrixbird.thread.marker") {

                let origin_server_ts = event.event.origin_server_ts
                if(origin_server_ts > sync_state.started) {
                    processNewEmailRoom(client, room.roomId)
                }

            }
        });

        client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
            if(!synced) return;
            if(event.event.type === "matrixbird.email.draft") {

                let origin_server_ts = event.event.origin_server_ts
                if(origin_server_ts > sync_state.started) {
                    console.log("Received new draft email.", event.event)
                }

            }
        });


        client.on(sdk.RoomEvent.Receipt, function (event, room, toStartOfTimeline) {
            for (const event_id in event.event.content) {
                let thread_id = event.event.content[event_id]?.["m.read"]?.[session.user_id]?.thread_id;
                if(thread_id && thread_id != "main") {
                    read_events.set(event_id, thread_id);
                }
            }
        });


        client.on(sdk.ClientEvent.AccountData, function (event, lastEvent) {
            let event_type = event.getType();
            let is_mailbox_data = event_type == "matrixbird.mailbox.rooms"
            if(is_mailbox_data) {
                processMailboxRooms(event);
            }
        });


        client.on(sdk.ClientEvent.Sync, async (state, prevState, data) => {

            sync_state.state = state;

            if (state === "ERROR") {
                sync_state.last_retry = Date.now();
                updateAppStatus("Failed to sync.")
            }

            if (state === "SYNCING") {
                //updateAppStatus("Syncing...")
            }

            if (state === "RECONNECTING") {
                sync_state.last_retry = Date().now;
            }

            if(state === "PREPARED") {

                if(!synced) {
                    await process(client)
                }


                sync_state.last_sync = Date.now();

                //buildThreads()
                updateAppStatus("Connected.")

                setTimeout(() => {
                    updateAppStatus('')
                }, 2000)


                nextSyncToken = data.nextSyncToken;

                synced = true


                if(session?.user_id) {
                    let logged_in_user = client.store.getUser(session.user_id);
                    user = logged_in_user;
                }



                Object.keys(client.store.rooms).forEach((roomId) => {
                    const room = client.getRoom(roomId);
                    rooms[roomId] = room;
                });


            }
        });



        let filter = sdk.Filter.fromJson(null, "test", {
            room: {
                ephemeral: {
                    types: ["m.receipt"],
                    unread_thread_notifications: true,
                    limit: 0,
                },
                state: {
                    unread_thread_notifications: true,
                    limit: 0,
                },
                timeline: {
                    unread_thread_notifications: true,
                    limit: 0,
                }
            }
        })

        let lists = new Map<string, MSC3575List>();
        lists.set("emails", {
            ranges: [[0, 50]],
            filters: {
                //tags: ["matrixbird.important"],
                //"not_tags": ["matrixbird.ignore"]
                is_dm: false
            },
            timeline_limit: 100,
            sort: ["by_recency"],
            required_state: [
                ["*", "*"],
                //["matrixbird.room.type", "*"],
                //["m.room.member", "*"]
            ],
            //bump_event_types: [ "matrixbird.email.matrix", "matrixbird.email.standard", "matrixbird.email.reply", "matrixbird.thread.marker" ]
        })

        let sliding_sync = new SlidingSync(
            PUBLIC_HOMESERVER,
            lists,
            {},
            client,
            30000
        );


        await client.startClient({
            slidingSync: sliding_sync,
            //filter: filter,
            //fullState: true,
            //initialSyncLimit: 0,
            //lazyLoadMembers: false,
            //disablePresence: true,
            //threadSupport: true,
            //resolveInvitesToProfiles: true,
        });


    }


    async function get_new_thread(room_id: string, thread_id: string) {
        let thread = await getThreadRootEvent(room_id, thread_id);
        console.log("found thread root event", thread)
        events.set(thread_id, thread);
        threads.set(thread_id, thread);

        let thread_children = await getThreadEvents(room_id, thread_id);
        let _events = thread_children.chunk;
        if(_events) {
            console.log("found thread events", _events)

            let filtered = _events?.filter(event => {
                return event.type != "matrixbird.thread.marker" && 
                    event.type != "matrixbird.thread.sync";
            })

            if(filtered.length > 0) {
                thread_events.set(thread_id, filtered);
                for (const child of filtered) {
                    events.set(child.event_id, child);
                }
            }
        } else {
            thread_events.set(thread_id, []);
        }
    }

    function getUser(user_id: string){
        return client.store.getUser(user_id)
    }


    async function doesRoomExist(userIds: string[] | null) {

        // check for an existing room with just this user
        if(!userIds || userIds.length === 0) {
            const rooms = client.getRooms();
            for (const room of rooms) {
                let stateEvent = room.currentState.getStateEvents("matrixbird.room.type")[0];
                let is_drafts = stateEvent.getContent().type === "DRAFTS";
                //ignore drafts room
                if (!stateEvent || is_drafts) continue;

                const joinedMembers = room.getJoinedMembers();
                const joinedUserIds = joinedMembers.map(member => member.userId);
                if (joinedUserIds.length === 1 && joinedUserIds[0] === client.getUserId()) {
                    return room.roomId;
                }
            }
        }


        // Get all rooms the logged-in user is in
        const rooms = client.getRooms();

        // Include the current user in our check if not already included
        const currentUserId = client.getUserId();
        const allRelevantUserIds = [...new Set([...userIds, currentUserId])];

        for (const room of rooms) {
            // Check if the room has the required state event
            let stateEvent = room.currentState.getStateEvents("matrixbird.room.type")[0];
            let is_email = stateEvent.getContent().type === "EMAIL";
            let is_inbox = stateEvent.getContent().type === "INBOX";
            if (!stateEvent || (!is_email && !is_inbox) ) continue;

            // Get all joined members in the room
            const joinedMembers = room.getJoinedMembers();
            const joinedUserIds = joinedMembers.map(member => member.userId);

            // Get all invited members in the room
            const invitedMembers = [];
            const memberEvents = room.currentState.getStateEvents("m.room.member");

            for (const event of memberEvents) {
                if (event.event.content.membership === "invite") {
                    console.log("event", event)
                    invitedMembers.push({ userId: event.event.state_key });
                }
            }

            const invitedUserIds = invitedMembers.map(member => member.userId);

            // Combine joined and invited member IDs for the check
            const allMemberUserIds = [...new Set([...joinedUserIds, ...invitedUserIds])];

            // Check if the members match exactly what we're looking for
            if (allMemberUserIds.length === allRelevantUserIds.length && 
                allRelevantUserIds.every(userId => allMemberUserIds.includes(userId))) {
                return room.roomId;
            }
        }

        // No matching room found
        return null;
    }

    const createEmailRoom = async (userIds: string[] | null): Promise<EmailRoomCreationResponse> => {

        const existingRoomId = await doesRoomExist(userIds);

        if (existingRoomId) {
            console.log(`Found existing email room with ${userIds}: ${existingRoomId}`);
            return {
                exists: true,
                room_id: existingRoomId,
            }
        }

        console.log(`No existing email room found with ${userIds}, creating one...`);

        let users: {
            [key: string]: number
        } = {}

        if(session.user_id) {
            users[session.user_id] =  100
        }

        if(userIds) {
            for (const userId of userIds) {
                users[userId] = 100;
            }
        }

        let room_opts = {
            preset: sdk.Preset.PrivateChat,
            //invite: userIds ? userIds : [],
            visibility: sdk.Visibility.Private,
            power_level_content_override: {
                users: users,
            },
            initial_state: [
                {
                    type: 'm.room.guest_access',
                    state_key: '',
                    content: {
                        guest_access: 'can_join'
                    }
                },
                {
                    type: 'matrixbird.room.type',
                    state_key: 'EMAIL',
                    content: {
                        type: 'EMAIL'
                    }
                },
            ]
        }

        try {
            const createRoomResult = await client.createRoom(room_opts);

            const newRoomId = createRoomResult.room_id;

            joined_rooms.push(newRoomId)
            console.log(`Created new email room with ${userIds}: ${newRoomId}`);
            return {
                exists: false,
                room_id: newRoomId,
            }
        } catch (error) {
            throw error;
        }

    };

    const updateMailboxRoomsAccountData = async () => {
        let ac = await client.setAccountData("matrixbird.mailbox.rooms", mailbox_rooms)
        console.log("Mailbox rooms updated in account data.", ac)
    }

    const getDraftsRoom = async (): Promise<string | undefined> => {

        let drafts_room = mailbox_rooms["DRAFTS"];
        if(!drafts_room) {
            console.log(mailbox_rooms)
            console.log("no drafts room in mailbox rooms")
        }

        return drafts_room;

        const rooms = client.getRooms();
        for (const room of rooms) {
            let stateEvent = room.currentState.getStateEvents("matrixbird.room.type")[0];
            let is_drafts = stateEvent.getContent().type === "DRAFTS";
            if(is_drafts) {
                return room.roomId;
            }
        }

        console.log("Drafts room not found, creating one...")
        const createRoomResult = await client.createRoom({
            preset: sdk.Preset.PrivateChat,
            visibility: sdk.Visibility.Private,
            initial_state: [
                {
                    type: 'matrixbird.room.type',
                    state_key: 'DRAFTS',
                    content: {
                        type: 'DRAFTS'
                    }
                },
            ]
        });

        const newRoomId = createRoomResult.room_id;

        joined_rooms.push(newRoomId)
        console.log("Added drafts room to joined rooms", joined_rooms)

        console.log(`Created new Drafts room with: ${newRoomId}`);

        mailbox_rooms["DRAFTS"] = newRoomId;
        updateMailboxRoomsAccountData();

    }



    return {

        get synced() {
            return synced;
        },

        get client() {
            return client;
        },

        get ready() {
            return ready;
        },

        get session() {
            return session;
        },

        get events() {
            return events;
        },

        get read_events() {
            return read_events;
        },

        get threads() {
            return threads;
        },

        get thread_events() {
            return thread_events;
        },

        get rooms() {
            return rooms;
        },

        get user() {
            return user;
        },

        get requests() {
            return requests;
        },

        get inbox_items() {
            return inbox_items;
        },

        get sent_items() {
            return sent_items;
        },

        get draft_items() {
            return draft_items;
        },

        createMatrixClient,
        getUser,
        doesRoomExist,
        createEmailRoom,
        getDraftsRoom,
        updateClientUISettings
    };
}

export async function updateClientUISettings(data: ClientUISettings) {
    await client.setAccountData(`matrixbird.client.settings.ui`, data)
    console.log("Client settings updated in account data.", data)
}


export async function createDraftsMailboxRoom() {
    console.log("Creating drafts mailbox room.")

    const createRoomResult = await client.createRoom({
        preset: sdk.Preset.PrivateChat,
        visibility: sdk.Visibility.Private,
        initial_state: [
            {
                type: 'matrixbird.room.type',
                state_key: 'DRAFTS',
                content: {
                    type: 'DRAFTS'
                }
            },
        ]
    });

    const newRoomId = createRoomResult.room_id;

    joined_rooms.push(newRoomId)

    console.log(`Created new Drafts room: ${newRoomId}`);

    mailbox_rooms["DRAFTS"] = newRoomId;

    let ac = await client.setAccountData("matrixbird.mailbox.rooms", mailbox_rooms)
    console.log("Mailbox rooms updated in account data.", ac)
}


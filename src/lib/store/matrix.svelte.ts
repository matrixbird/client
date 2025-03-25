import { PUBLIC_HOMESERVER } from '$env/static/public';
import { MatrixClient } from 'matrix-js-sdk/src/index';
import { 
    SlidingSync, 
    type MSC3575List,
    type MSC3575Filter,
    type MSC3575RoomSubscription,
} from 'matrix-js-sdk/src/sliding-sync';
import * as sdk from 'matrix-js-sdk/src/index';
import { SvelteMap } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { untrack } from 'svelte';

import { session, updateSession, sessionExists, type Session } from '$lib/store/session.svelte';


import { newSlidingSync } from '$lib/store/sync.svelte'

import type {
    Threads,
    ThreadEvents
} from '$lib/types/matrixbird';

import { updateAppStatus, ui_state } from '$lib/store/app.svelte';

import { 
    process,
    processSync,
    processNewEmail,
    processNewEmailRoom,
    buildInboxEmails,
    buildSentEmails,
} from '$lib/store/process.svelte'

import { v4 as uuidv4 } from 'uuid';
import {
    goto,
} from '$app/navigation';

import {
    getAccountData,
    getThreadRootEvent,
    getThreads,
    getThreadEvents,
    syncOnce,
    slidingSync,
    getRoomState,
} from '$lib/matrix/api'

import {
    is_local_room
} from '$lib/utils/matrix'


let conn_id: string = $state(uuidv4());

let ready = $state(false);
let synced = $state(false);

let user = $state(null);

let nextSyncToken = $state(null);

let client: MatrixClient = $state(sdk.createClient({
    baseUrl: PUBLIC_HOMESERVER,
}));


export let rooms = $state({});
export let users = $state(new SvelteMap());


export let events = $state(new SvelteMap());
export let threads: Threads = $state(new SvelteMap());
export let thread_events: ThreadEvents = $state(new SvelteMap());

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

export let mailbox_rooms: {
    [key: string]: string
} = $state({});

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
            baseUrl: PUBLIC_HOMESERVER,
            accessToken: session.access_token,
            userId: session.user_id,
            deviceId: session.device_id,
            //store: store,
            timelineSupport: true,
            supportsCallTransfer: false,
            useE2eForGroupCall: false
        });

        try {
            const whoami = await client.whoami()
            console.log(whoami);
            updateAppStatus("Verified user.")
        } catch(e) {
            if(e.errcode === "M_UNKNOWN_TOKEN") {
                console.warn("Invalid access token. Logging out.")
                goto('/login')
                return
            }
        }

        console.log("Sync started at", sync_state.started)

        /*
        try {
            const rooms = await client.getJoinedRooms();
            joined_rooms = rooms.joined_rooms;
        } catch(e) {
        }

        try {
            const mailboxes: {[key: string]: string} = await getAccountData(
                "matrixbird.mailbox.rooms"
            );
            if(mailboxes) {
                for (const [key, value] of Object.entries(mailboxes)) {
                    mailbox_rooms[key] = value;
                }
                console.log("mailbox rooms", $state.snapshot(mailbox_rooms))
            }
        } catch(e) {
        }
        try {
            const sync = await slidingSync(conn_id);
            //await processSync(sync);

        } catch(e) {
            throw e
        }

        //let spoll = newSlidingSync()
        //spoll.start()

        try {
            const init_sync = await syncOnce();


            for (const [room_id, room] of Object.entries(init_sync.rooms.join)) {

                //console.log(room_id)
                //
                joined_rooms.push(room_id)

                let pending_event = room.state?.events?.find(e => e.type == "matrixbird.email.pending");
                if(pending_event) {
                    pending_emails_event = pending_event;
                }


            } 
            //console.log("read events are", read_events)
            //console.log("Joined rooms: ", $state.snapshot(joined_rooms))

            if(init_sync.rooms.invite) {
                for (const [room_id, room] of Object.entries(init_sync.rooms.invite)) {
                    let joined = await client.joinRoom(room_id);
                    joined_rooms.push(joined.roomId)
                    let is_local = is_local_room(joined.roomId);
                    if(!is_local) {
                        const state = await getRoomState(room_id);
                        console.log("remote room state", state)
                        const messagesResult = await client.createMessagesRequest(joined.roomId, null, 100, 'b', null);
                        const messages = messagesResult.chunk;
                        console.log(`Fetched ${messages.length} messages using createMessagesRequest`);
                        for (const message of messages) {
                            if (message.type.includes("matrixbird.email")) {
                                //events.set(message.event_id, message);
                            }
                        }

                    }
                } 
            } 


        } catch(e) {
            console.error("Failed to sync", e)
        }

        /*
    try {
      const mailboxes = await client.getAccountDataFromServer("matrixbird.mailbox.rooms");
      if(mailboxes) {
        for (const [key, value] of Object.entries(mailboxes)) {
          mailbox_rooms[key] = value;
        }
      }
      console.log("mailbox rooms", mailbox_rooms)

    } catch(e) {
    }

    if(mailbox_rooms["INBOX"]) {
      try {
        let room_id = mailbox_rooms["INBOX"];
        const pending = await getStateEvent(
          session.access_token, 
          room_id,
          "matrixbird.email.pending", 
          ""
        );
        if(pending?.pending?.length > 0) {
          console.log("found pending emails", pending.pending)
          pending.emails = pending.pending;

          for (const email of pending.pending) {
            let event = await getEvent(
              session.access_token, 
              room_id,
              email.event_id
            );

            if(event) {

              let request = {
                type: "matrixbird.email.standard",
                event_id: event.event_id,
                preview: event.content,
                event: event,
                state: email.state,
              }
              email_requests.push(request)
            }
          }
        }
      } catch(e) {
      }
    } else {
      console.log("no inbox room")
    }
    */
        client.on(sdk.RoomStateEvent.NewMember, function (event, state, member) {
            //if(!synced) return;
            if(member.userId !== session.user_id) {
                //console.log("new member", event, state, member)
            }
        });


        client.on(sdk.RoomEvent.MyMembership, function (room, membership, prev) {

            if(!synced) return;

            if (membership === sdk.KnownMembership.Join) {
                console.log("Joined new email room. Fetch messages.", room)
                processNewEmailRoom(client, room.roomId);
            }

        });




        async function init_remote_room(roomId) {
            try {
                const messagesResult = await client.createMessagesRequest(roomId, null, 100, 'b', null);
                const messages = messagesResult.chunk;
                console.log(`Fetched ${messages.length} messages using createMessagesRequest`, messages);
                joined_rooms.push(roomId);
                //buildThreadForJoinedRoom(roomId)
            } catch (error) {
                console.error("Error joining room:", roomId, error);
            }
        }



        client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
            if (event.event.type == "matrixbird.email.reply") {
                let origin_server_ts = event.event.origin_server_ts
                if(origin_server_ts > sync_state.started) {
                    console.log(origin_server_ts > sync_state.started)
                    console.log("New email reply.", event.event)
                    let thread_id = event.event.content?.["m.relates_to"]?.event_id;

                    let exists = threads.get(thread_id);
                    if(!exists) {
                        get_new_thread(event.event.room_id, thread_id)
                        return
                    }

                    let children = thread_events.get(thread_id);
                    //console.log("children", children)
                    if(children) {
                        thread_events.set(thread_id, [...children, event.event]);
                    } else {
                        thread_events.set(thread_id, [event.event]);
                    }
                    events.set(event.event.event_id, event.event);
                }
            }
        });

        /*
        client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
            if(!synced) return;
            if(event.event.type === "matrixbird.email.matrix" || 
            event.event.type === "matrixbird.email.standard") {

                let origin_server_ts = event.event.origin_server_ts
                if(origin_server_ts > sync_state.started) {
                    processNewEmail(event)
                }

            }
        });

        client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
            if(!synced) return;
            if(event.event.type === "matrixbird.email.sync" ) {

                let origin_server_ts = event.event.origin_server_ts
                if(origin_server_ts > sync_state.started) {
                    console.log("Email sync state event. We should fetch this.")
                    init_remote_room(event.event.room_id)

                }

            }
        });
        */


        /*
        client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
            if(!synced) return;
            if(event.event.type === "matrixbird.thread.marker" || 
            event.event.type === "matrixbird.thread.sync") {

                let origin_server_ts = event.event.origin_server_ts
                if(origin_server_ts > sync_state.started) {
                    console.log("new thread marker, pull it in", event.event.type)
                    let thread_id = event.event.content?.["m.relates_to"]?.event_id;
                    get_new_thread(event.event.room_id, thread_id)

                }

            }
        });

        client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
            if(!synced) return;
            if(event.event.type === "matrixbird.email.matrix" || 
            event.event.type === "matrixbird.email.standard") {

                let origin_server_ts = event.event.origin_server_ts
                if(origin_server_ts > sync_state.started) {
                    console.log("New email event.", event.event.type)
                    get_new_thread(event.event.room_id, event.getId())

                }
            }
        });

    client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
      if(event.event.type === "matrixbird.receipt" && 
        event.event.sender == session.user_id) {

          let _event_id = event.event.content?.["m.relates_to"]?.["m.in_reply_to"];
          if(_event_id) {
            read_events.set(_event_id, event.event);
          }

      }
    });
    */

        client.on(sdk.RoomEvent.Receipt, function (event, room, toStartOfTimeline) {
            for (const event_id in event.event.content) {
                let thread_id = event.event.content[event_id]?.["m.read"]?.[session.user_id]?.thread_id;
                if(thread_id && thread_id != "main") {
                    read_events.set(event_id, thread_id);
                }
            }
        });


        async function refresh(room) {
            //room.setTimelineNeedsRefresh(true);
            //await room.refreshLiveTimeline();
            //console.log("refreshed live timeline")
        }


        /*
    client.on(sdk.RoomEvent.Timeline, async function (event, room, toStartOfTimeline) {
      if(event?.event) {
        //console.log(event.event.origin_server_ts > sync_state.started, event.event)

        let event_type = event.event.type;

        if (event_type.includes("matrixbird.email")) {

          let isSending = event.isSending();

          if(isSending) {
            setTimeout(() => {
              //events.set(event.event.event_id, event.event);
            }, 1000)
          }

          if(!isSending) {
            //events.set(event.event.event_id, event.event);
          }

        }
      }

      if(event.event.type == "m.room.member" &&
        event.event.content?.membership == "join") {

        let exists = members.get(event.event.state_key);
        if(!exists) {
          members.set(event.event.state_key, event.event);
        } else {

        }

      }

      if(event.event.type == "matrixbird.thread.marker") {
        //console.log("new thread marker, pull it in")
      }
    });
    */

        /*
    client.on(sdk.RoomStateEvent.Events, function (event, room, toStartOfTimeline) {
      if(event?.event) {
        let event_type = event.event.type;
        if (event_type === "matrixbird.email.matrix") {
          let exists = events.find((e) => e.event_id === event.event.event_id);
          if(!exists) {
            events.push(event.event);
          }
        }
        //console.log(event.event)
      }
    });
    */


        async function buildThreadForJoinedRoom(roomId: string) {
            let thread = await getThreads(roomId);
            console.log("found threads", thread)

            if(thread.chunk.length > 0) {
                for (const event of thread.chunk) {
                    //threads.set(event.event_id, event);
                    get_new_thread(event.room_id, event.event_id)
                }
            }
        }

        async function buildThreadEvents(roomEventsMap) {

            const eventPairs = [];

            for (const [roomId, events] of Object.entries(roomEventsMap)) {
                const filteredEvents = events.filter(event => {
                    let latest_event = event?.unsigned?.["m.relations"]?.["m.thread"]?.latest_event;
                    return latest_event.type != "matrixbird.thread.marker";
                });

                filteredEvents.forEach(event => {
                    eventPairs.push([roomId, event.event_id]);
                });
            }

            const threadPromises = eventPairs.map(([roomId, eventId]) => 
                getThreadEvents(roomId, eventId));
            const allEvents = await Promise.allSettled(threadPromises);

            const updates = new Map();

            allEvents.forEach((result) => {
                if (result.status === 'fulfilled') {
                    const items = result.value;

                    // add all events to events map
                    for (const event of items.chunk) {
                        events.set(event.event_id, event);

                        /*
            if(event.type == "matrixbird.receipt" && 
              event.sender == session.user_id) {

              let _event_id = event.content?.["m.relates_to"]?.["m.in_reply_to"];
              if(_event_id) {
                read_events.set(_event_id, event);
              }

            }
            */

                    }

                    let thread_root = items.chunk[0]?.content?.["m.relates_to"]?.event_id;

                    if (thread_root) {
                        let filtered = items.chunk.filter(event => {
                            return event.type != "matrixbird.thread.marker";
                        });
                        filtered = filtered.filter(event => {
                            return event.type != "matrixbird.receipt";
                        });
                        updates.set(thread_root, filtered);
                    }
                }
            });

            updates.forEach((value, key) => {
                thread_events.set(key, value);
            });

        }


        async function buildThreads() {
            let rooms = joined_rooms;
            /*
      rooms = rooms.filter(room => {
        let roomType = room.currentState.getStateEvents("matrixbird.room.type")[0]?.event?.state_key;
        console.log(roomType, room)
        return roomType == "INBOX" || roomType == "EMAIL"
      })
      */

            const threadPromises = rooms.map(room => getThreads(room));
            const allThreads = await Promise.allSettled(threadPromises);

            const roomEventsMap = {};
            const threadUpdates = new Map();

            allThreads.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const roomId = rooms[index];
                    roomEventsMap[roomId] = result.value.chunk;

                    result.value.chunk.forEach(thread => {
                        threadUpdates.set(thread.event_id, thread);
                    });

                    // check if federated room with no local events
                    // initate state/messages request if so
                    let is_local = is_local_room(roomId);
                    if (!is_local && result.value.chunk.length === 0) {
                        console.log("no threads found, we should fetch it", roomId)
                        init_remote_room(roomId);
                    }

                }
            });

            threadUpdates.forEach((value, key) => {
                events.set(key, value);
                threads.set(key, value);
            });

            await buildThreadEvents(roomEventsMap);

            status.threads_ready = true;
            status.thread_events_ready = true;


            ready = true;
        }


        client.on("sync", async (state, prevState, data) => {

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
                    updateAppStatus(null)
                }, 2000)


                nextSyncToken = data.nextSyncToken;

                synced = true
                //console.log(client.store)

                let logged_in_user = client.store.getUser(client.getUserId());
                user = logged_in_user;


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

    const createEmailRoom = async (userIds: string[] | null, preview: object) => {

        const existingRoomId = await doesRoomExist(userIds);

        if (existingRoomId) {
            console.log(`Found existing email room with ${userIds}: ${existingRoomId}`);
            return existingRoomId;
        }

        console.log(`No existing email room found with ${userIds}, creating one...`);

        let users = {
            [session.user_id]: 100,
        }

        for (const userId of userIds) {
            users[userId] = 100;
        }

        // Create a new DM room
        const createRoomResult = await client.createRoom({
            preset: sdk.Preset.PrivateChat,
            //invite: userIds ? userIds : [],
            visibility: sdk.Visibility.Private,
            //power_level_content_override: {
                //users: users,
            //},
            initial_state: [
                {
                    type: 'm.room.guest_access',
                    state_key: '',
                    content: {
                        guest_access: 'can_join'
                    }
                },
                {
                    type: 'm.room.topic',
                    state_key: '',
                    content: {
                        topic: 'screen',
                        preview: preview
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
        });

        const newRoomId = createRoomResult.room_id;

        //created_rooms[userId] = newRoomId;
        joined_rooms.push(newRoomId)
        console.log("Added to joined rooms", joined_rooms)

        console.log(`Created new email room with ${userIds}: ${newRoomId}`);

        return newRoomId;
    };

    const updateMailboxRoomsAccountData = async () => {
        let ac = await client.setAccountData("matrixbird.mailbox.rooms", mailbox_rooms)
        console.log("Mailbox rooms updated in account data.", ac)
    }

    const getDraftsRoom = async () => {

        let drafts_room = mailbox_rooms["DRAFTS"];
        if(!drafts_room) {
            console.log(mailbox_rooms)
            console.log("no drafts room in mailbox rooms")
        }

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

        createMatrixClient,
        getUser,
        doesRoomExist,
        createEmailRoom,
        getDraftsRoom,
        updateClientSettings
    };
}

export async function updateClientSettings(settings_type, data) {
    await client.setAccountData(`matrixbird.client.settings.${settings_type}`, data)
    console.log("Client settings updated in account data.", data)
}


export async function join_room(roomId: string) {

    try {

        console.log("Joining room:", roomId);
        let room = await client.joinRoom(roomId, {
            syncRoom: true,
        });

        await client.scrollback(room, 1000);

        let init = await client.roomInitialSync(roomId, 100);
        console.log("Initial sync", init)

        setTimeout(async () => {

            const state = await getRoomState(roomId);
            console.log("remote room state", state)

            const messagesResult = await client.createMessagesRequest(roomId, null, 100, 'b', null);
            const messages = messagesResult.chunk;
            console.log(`Fetched ${messages.length} messages using createMessagesRequest`);

        }, 1000)

    } catch (error) {
        console.error("Error joining room:", roomId, error);
    }
}

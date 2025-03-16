import { PUBLIC_HOMESERVER } from '$env/static/public';
import * as sdk from 'matrix-js-sdk';
import { SvelteMap } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { untrack } from 'svelte';

import { updateAppStatus, ui_state } from '$lib/store/app.svelte';

import { 
  buildInboxEmails,
  buildSentEmails
} from '$lib/matrix/process'

import { v4 as uuidv4 } from 'uuid';
import {
  goto,
} from '$app/navigation';

import {
  getEvent,
  getStateEvent,
  getAccountData,
  getThreadRootEvent,
  getThreads,
  getThreadEvents,
  syncOnce,
  getRoomState,
} from '$lib/matrix/api.js'

import {
  is_local_room
} from '$lib/utils/matrix'

let ready = $state(false);
let synced = $state(false);
let session = $state(null);
let msg = $state(null);

let user = $state(null);

let nextSyncToken = $state(null);

let client = $state(null);
let loaded = $state(false);

let rooms = $state({});
let members = $state(new SvelteMap());

let threads = $state(new SvelteMap());
let thread_events = $state(new SvelteMap());

export let email_requests = $state([]);

export let large_email_content = $state(new SvelteMap());

let events = $state(new SvelteMap());

let read_events = $state(new SvelteMap());

let joined_rooms = $state([]);

export let status = $state({
  events_ready: false,
  threads_ready: false,
  inbox_ready: false,
  sent_ready: false,
  thread_events_ready: false,
});

let created_rooms = $state({});

export let sync_state = $state({
  started: 0,
  synced: false,
  state: null,
  last_sync: null,
  last_retry: null,
});

let requests = $derived.by(() =>{
  return email_requests;
})

let inbox_items = $derived.by(() =>{
  if(!status.threads_ready || !status.thread_events_ready) {
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

export let mailbox_rooms = $state({});

let pending_emails_event = $state(null);

export function createMatrixStore() {

  function updateSession(data) {
    session = data
    console.log("Updated session", data)
  }

  async function createMatrixClient(opts) {

    if(session) {
      console.info("Session already exists.")
      return;
    }

    if(!opts?.access_token || !opts?.user_id || !opts?.device_id) {
      console.error("No session provided.")
      return;
    }

    session = opts

    console.info("Creating matrix client.", opts)
    updateAppStatus("Connecting...")

    let store_opts = { indexedDB: window.indexedDB, localStorage: window.localStorage };
    let store = new sdk.IndexedDBStore(store_opts);


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

    try {
      const rooms = await client.getJoinedRooms();
      joined_rooms = rooms.joined_rooms;
    } catch(e) {
    }

    try {
      const mailboxes = await getAccountData(
        session.access_token,
        session.user_id,
        "matrixbird.mailbox.rooms"
      );
      if(mailboxes) {
        for (const [key, value] of Object.entries(mailboxes)) {
          mailbox_rooms[key] = value;
        }
        console.log("mailbox rooms", mailbox_rooms)
      }
    } catch(e) {
    }

    try {
      const init_sync = await syncOnce(session.access_token);
      console.log(init_sync);

      /*
      let mb_rooms = init_sync.account_data?.events?.find(e => e.type == "matrixbird.mailbox.rooms");
      if(mb_rooms) {
        for (const [key, value] of Object.entries(mb_rooms.content)) {
          mailbox_rooms[key] = value;
        }
      }
      */

      for (const [room_id, room] of Object.entries(init_sync.rooms.join)) {
        let pending_event = room.state?.events?.find(e => e.type == "matrixbird.email.pending");
        if(pending_event) {
          pending_emails_event = pending_event;
        }

        // build read_events
        let ephemeral = room.ephemeral?.events;
        if(ephemeral) {
          for (const event of ephemeral) {
            if(event.type == "m.receipt") {
              for (const event_id in event.content) {
                let thread_id = event.content[event_id]?.["m.read"]?.[session.user_id]?.thread_id;
                if(thread_id && thread_id != "main") {
                  read_events.set(event_id, thread_id);
                  //console.log("read events", read_events)
                }
              }
            }
          }
        }

      } 

      if(init_sync.rooms.invite) {
        for (const [room_id, room] of Object.entries(init_sync.rooms.invite)) {
          let joined = await client.joinRoom(room_id);
          joined_rooms.push(joined.roomId)
          let is_local = is_local_room(joined.roomId);
          if(!is_local) {
            const state = await getRoomState(session.access_token, roomId);
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


    sync_state.started = Date.now();


    client.on(sdk.RoomEvent.MyMembership, function (room, membership, prev) {

      if (membership === sdk.KnownMembership.Join) {
        //console.log("joined", room.roomId)
        //joined_rooms.push(room.roomId)
      }

      if (membership === sdk.KnownMembership.Invite) {

        let exists = joined_rooms.find(r => r === room.roomId);
        if(exists) {
          return;
        }

        //console.log("Invited to room:", room.roomId);
        //create_email_request(room)

        let is_local = is_local_room(room.roomId);
        if(is_local) {
          setTimeout(() => {
            join_local_room(room.roomId)
          }, 100)
        } else {
          setTimeout(() => {
            join_room(room.roomId);
          }, 1000)
        }
      }
    });

    async function create_email_request(room) {

      let state = room.getLiveTimeline().getState(sdk.EventTimeline.FORWARDS)
      let preview = state.getStateEvents("m.room.topic")[0]?.event?.content?.preview;
      let member_events = state.getStateEvents("m.room.member")

      let invite_event = member_events.find(e => e.event.content?.membership == "invite");

      let from = state.getMembersExcept([session.user_id])[0];
      console.log(state.getMembersExcept([session.user_id]))

      let profile = await client.getProfileInfo(from.userId);
      console.log("profile", profile)

      let event_id = uuidv4();

      let request = {
        type: "matrixbird.email.matrix",
        room_id: room.roomId,
        event_id: invite_event.event.event_id,
        preview: preview,
        user: {
          user_id: from?.userId,
          name: from?.name,
          displayName: profile?.displayname || from?.rawDisplayName,
        },
      }

      email_requests.push(request)
      console.log(email_requests)

      setTimeout(async () => {
        //let leave = await client.leave(room.roomId);
        //console.log("leave", leave)
      }, 1000)
    }


    async function join_local_room(roomId) {

      let exists = joined_rooms.find(r => r === roomId);
      if(exists) {
        return;
      }
      console.log("Joining local room:", roomId);

      let room = await client.joinRoom(roomId, {
        syncRoom: true,
      });

      console.log("Joined local room:", room);
      joined_rooms.push(roomId);
      buildThreadForJoinedRoom(roomId)

      /*
      setTimeout(async () => {
        let refreshed = await room.refreshLiveTimeline();
        //console.log("refresh", refreshed)
        const _events = room.getLiveTimeline().getEvents();
        console.log("events are", _events)
        let roomJoinEvent = _events.find(e => e.event.type == "m.room.member" && e.event.content?.membership == "join");
        console.log("room join event", roomJoinEvent)

        let read = await client.sendReceipt(roomJoinEvent, "m.read")
        console.log('read', read)

        let dummy_event = await client.sendEvent(room.roomId, "matrixbird.dummy.event", {
          msgtype: "matrixbird.dummy.event"
        })
        console.log("dummy event", dummy_event)


      }, 1000)
      */

    }

    async function join_room(roomId) {

      let exists = joined_rooms.find(r => r === roomId);
      if(exists) {
        return;
      }

      try {

        console.log("Joining room:", roomId);
        let room = await client.joinRoom(roomId, {
          syncRoom: true,
        });

        setTimeout(async () => {

          const state = await getRoomState(session.access_token, roomId);
          console.log("remote room state", state)

          const messagesResult = await client.createMessagesRequest(roomId, null, 100, 'b', null);
          const messages = messagesResult.chunk;
          console.log(`Fetched ${messages.length} messages using createMessagesRequest`);
          joined_rooms.push(roomId);
          buildThreadForJoinedRoom(roomId)

        }, 1000)


      } catch (error) {
        console.error("Error joining room:", roomId, error);
      }
    }

    client.on(sdk.RoomStateEvent.Events, function (event, room, toStartOfTimeline) {
      if(event?.event?.type == "matrixbird.email.pending") {
        if(pending_emails_event?.origin_server_ts < event.event.origin_server_ts) {
          pending_emails_event = event.event;
          console.log("updated pending emails", pending_emails_event)
        }
      }
    });


    client.on(sdk.RoomStateEvent.Events, function (event, room, toStartOfTimeline) {
      if(event?.event?.type == "matrixbird.room.type") {
        //console.log(event.event)
        //console.log(event.event.state_key)
      }
    });

    client.on(sdk.RoomStateEvent.Events, function (event, room, toStartOfTimeline) {
      if(event?.event?.type == "matrixbird.room.type") {
        let origin_server_ts = event.event.origin_server_ts
        if(origin_server_ts > sync_state.started) {
          //console.log("created a new room", event.event.state_key)
        }
      }
    });


    client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
      if (event.event.type == "matrixbird.email.reply") {
        let origin_server_ts = event.event.origin_server_ts
        if(origin_server_ts > sync_state.started) {
          console.log("new email reply, add it to the right place", event.event)
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

    client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
      let exists = joined_rooms.find(r => r === room.roomId);
      if(!exists) {
        console.log("not in room", room.roomId)
        return;
      }
      if(event.event.type === "matrixbird.thread.marker") {

        let origin_server_ts = event.event.origin_server_ts
        if(origin_server_ts > sync_state.started) {
          console.log("new thread marker, pull it in")
          let thread_id = event.event.content?.["m.relates_to"]?.event_id;
          get_new_thread(event.event.room_id, thread_id)

          refresh(room);

        }

      }
    });

    /*
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


    async function buildThreadForJoinedRoom(roomId) {
      let thread = await getThreads(session.access_token, roomId);
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
        getThreadEvents(session.access_token, roomId, eventId));
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

      const threadPromises = rooms.map(room => getThreads(session.access_token, room));
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
        }
      });

      threadUpdates.forEach((value, key) => {
        events.set(key, value);
        threads.set(key, value);
      });

      await buildThreadEvents(roomEventsMap);
      console.log("thread events are", thread_events)

      status.threads_ready = true;
      status.thread_events_ready = true;


      ready = true

    }


    client.on("sync", (state, prevState, data) => {

      sync_state.state = state;

      if (state === "ERROR") {
        sync.last_retry = new Date();
        updateAppStatus("Failed to sync.")
      }

      if (state === "SYNCING") {
        //updateAppStatus("Syncing...")
      }

      if (state === "RECONNECTING") {
        sync_state.last_retry = new Date();
      }

      if(state === "PREPARED") {
        buildThreads()
        updateAppStatus("Connected.")

        setTimeout(() => {
          updateAppStatus(null)
        }, 2000)

        sync_state.last_sync = Date.now();

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
          limit: 1000,
        },
        timeline: {
          unread_thread_notifications: true,
          limit: 100,
        }
      }
    })

    await client.startClient({
      filter: filter,
      //fullState: true,
      initialSyncLimit: 1000,
      lazyLoadMembers: false,
      //disablePresence: true,
      //threadSupport: true,
      resolveInvitesToProfiles: true,
    });


  }


  async function get_new_thread(room_id, thread_id) {
    let thread = await getThreadRootEvent(session.access_token, room_id, thread_id);
    console.log("found thread root event", thread)
    events.set(thread_id, thread);
    threads.set(thread_id, thread);

    let thread_children = await getThreadEvents(session.access_token, room_id, thread_id);
    let _events = thread_children.chunk;
    if(_events) {
      console.log("found thread events", _events)

      let filtered = _events?.filter(event => {
        return event.type != "matrixbird.thread.marker";
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

  function getUser(user_id){
    return client.store.getUser(user_id)
  }


  async function doesRoomExist(userIds) {

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

  const createEmailRoom = async (userIds, preview) => {

    const existingRoomId = await doesRoomExist(userIds);

    if (existingRoomId) {
      console.log(`Found existing email room with ${userIds}: ${existingRoomId}`);
      return existingRoomId;
    }

    console.log(`No existing email room found with ${userIds}, creating one...`);

    // Create a new DM room
    const createRoomResult = await client.createRoom({
      preset: 'private_chat',
      invite: userIds ? userIds : [],
      visibility: 'private',
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
      preset: 'private_chat',
      visibility: 'private',
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

    updateSession,
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

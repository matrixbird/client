import * as sdk from 'matrix-js-sdk';
import { SvelteMap } from 'svelte/reactivity';
import { browser } from '$app/environment';

import { updateAppStatus } from '$lib/store/app.svelte.js';

import { 
  PUBLIC_HOMESERVER,
} from '$env/static/public';
import { v4 as uuidv4 } from 'uuid';
import {
  goto,
} from '$app/navigation';

import {
  is_local_room,
} from '$lib/utils/matrix.js'

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

export let inbox_mail = $state(new SvelteMap());
export let sent_mail = $state(new SvelteMap());

let events = $state(new SvelteMap());

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

export let mailbox_rooms = $state({
  inbox: null,
  drafts: null,
  self: null,
});

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

    client =  sdk.createClient({
      baseUrl: PUBLIC_HOMESERVER,
      accessToken: session.access_token,
      userId: session.user_id,
      deviceId: session.device_id,
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
      const mailboxes = await client.getAccountDataFromServer("matrixbird.mailbox.rooms");
      console.log("mailboxes", mailboxes)

    } catch(e) {
    }


    sync_state.started = Date.now();


    client.on(sdk.RoomEvent.MyMembership, function (room, membership, prev) {

      if (membership === sdk.KnownMembership.Join) {
        //console.log("joined", room.roomId)
        //joined_rooms.push(room.roomId)
      }

      if (membership === sdk.KnownMembership.Invite) {
        let is_local = is_local_room(room.roomId);
        if(is_local) {
          setTimeout(() => {
            join_local_room(room.roomId)
          }, 100)
        } else {
          setTimeout(() => {
            join_room(room.roomId);
          }, 2000)
        }
      }
    });


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

        // Join the room since we're not already in it
        console.log("Joining room:", roomId);
        let room = await client.joinRoom(roomId, {
          syncRoom: true,
        });

        setTimeout(async () => {
          const messagesResult = await client.createMessagesRequest(room.roomId, null, 100, 'b', null);
          const messages = messagesResult.chunk;
          console.log(`Fetched ${messages.length} messages using createMessagesRequest`);
          for (const message of messages) {
            if (message.type.includes("matrixbird.email")) {
              //events.set(message.event_id, message);
            }
          }

          room = client.getRoom(roomId);
          let refreshed = await room.refreshLiveTimeline();
          //console.log("refresh", refreshed)
          const _events = room.getLiveTimeline().getEvents();
          //console.log("events are", _events)
          let roomJoinEvent = _events.find(e => e.event.type == "m.room.member" && e.event.content?.membership == "join");
          console.log("room join event", roomJoinEvent)

          let read = await client.sendReceipt(roomJoinEvent, "m.read")
          console.log('read', read)

        }, 2000)


      } catch (error) {
        console.error("Error joining room:", roomId, error);
      }
    }

    client.on(sdk.RoomStateEvent.Events, function (event, room, toStartOfTimeline) {
      if(event?.event?.type == "matrixbird.room.type") {
        //console.log(event.event)
        //console.log(event.event.state_key)
      }
    });

    client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
      if (event.event.type == "matrixbird.email.reply") {
        let origin_server_ts = event.event.origin_server_ts
        if(origin_server_ts > sync_state.started) {
          console.log("new email reply, add it to the right place", event.event)
          let thread_id = event.event.content?.["m.relates_to"]?.event_id;
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
      if(event.event.type == "matrixbird.thread.marker") {
        let origin_server_ts = event.event.origin_server_ts
        if(origin_server_ts > sync_state.started) {
          console.log("new thread marker, pull it in")
          let thread_id = event.event.content?.["m.relates_to"]?.event_id;
          get_new_thread(event.event.room_id, thread_id)
        }
      }
    });


    async function get_new_thread(room_id, thread_id) {
      let thread = await get_thread_root_event(room_id, thread_id);
      console.log("found thread root event", thread)
      events.set(thread_id, thread);
      threads.set(thread_id, thread);

      let thread_children = await get_thread_events(room_id, thread_id);
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
      //await buildInbox();
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


    const get_threads = async (roomId) => {
      const url = `${PUBLIC_HOMESERVER}/_matrix/client/v1/rooms/${roomId}/threads?limit=50`;

      let options = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
      }

      try {
        const response = await fetch(url, options)
        return response.json();
      } catch (error) {
        throw error
      }

    }

    const get_thread_root_event = async (roomId, eventId) => {
      const url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/event/${eventId}`;

      let options = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
      }

      try {
        const response = await fetch(url, options)
        return response.json();
      } catch (error) {
        throw error
      }

    }

    const get_thread_events = async (roomId, eventId) => {
      const url = `${PUBLIC_HOMESERVER}/_matrix/client/v1/rooms/${roomId}/relations/${eventId}/m.thread?limit=50`;

      let options = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
      }

      try {
        const response = await fetch(url, options)
        return response.json();
      } catch (error) {
        throw error
      }

    }

    function hasNoUserEvents(threadEvents) {
      return !threadEvents.some(event => event.sender === session.user_id);
    }

    function findLastNonUserEvent(threadEvents) {
      const nonUserEvents = threadEvents.filter(event => event.sender !== session.user_id);

      if (nonUserEvents.length === 0) return null;

      return nonUserEvents.reduce((latest, current) => 
        current.origin_server_ts > latest.origin_server_ts ? current : latest, 
        nonUserEvents[0]);
    }

    async function buildSentMail() {
      //console.log("building sent mail with threads")
      for (const [threadId, thread] of threads) {
        let children = thread_events.get(threadId);
        // if thread root is sent by this user, add to sent
        if(thread.sender == user.userId) {
          sent_mail.set(threadId, thread);
        }
        // add any child event sent by this user
        if(children) {
          for (const child of children) {
            if(child.sender == user.userId) {
              sent_mail.set(child.event_id, child);
            }
          }
        }
      }
      //console.log("sent mail built", sent_mail)
      status.sent_ready = true;
    }


    async function buildInbox() {
      //console.log("building inbox with threads")
      for (const [threadId, thread] of threads) {
        let children = thread_events.get(threadId);
        // this thread has event relations, we'll need to process 
        // them to find the latest reply from another sender
        if(children) {
          let nonUserReply = findLastNonUserEvent(children);
          if(nonUserReply) {
            inbox_mail.set(nonUserReply.event_id, nonUserReply);
          } else {
            // this may be an email chain started by another user but 
            // all child events are sent by this user, so we'll 
            // return the original thread event
            inbox_mail.set(threadId, thread);
          }
        }
        // this thread has no event relations, so this is either
        // an email sent by this user or recieved from another user
        // add to inbox if it's not sent by this user
        if(!children) {
          if(thread.sender != user.userId) {
            inbox_mail.set(threadId, thread);
          }
        }
      }
      console.log("inbox built", inbox_mail)
      status.inbox_ready = true;
    }

    async function buildThreadForJoinedRoom(roomId) {
      let thread = await get_threads(roomId);
      console.log("found threads", thread)
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
        get_thread_events(roomId, eventId));
      const allEvents = await Promise.allSettled(threadPromises);

      const updates = new Map();

      allEvents.forEach((result) => {
        if (result.status === 'fulfilled') {
          const items = result.value;

          // add all events to events map
          for (const event of items.chunk) {
            events.set(event.event_id, event);
          }

          let thread_root = items.chunk[0]?.content?.["m.relates_to"]?.event_id;

          if (thread_root) {
            let filtered = items.chunk.filter(event => {
              return event.type != "matrixbird.thread.marker";
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

      const threadPromises = rooms.map(room => get_threads(room));
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

      status.threads_ready = true;
      status.thread_events_ready = true;

      //await buildInbox();
      //await buildSentMail();



      for (const room of rooms) {

        /*
        let roomType = room.currentState.getStateEvents("matrixbird.room.type")[0];
        console.log(roomType)

        let filter = sdk.Filter.fromJson(null, "test", {
          room: {
            timeline: {
              types: ['matrixbird.email.matrix'],
              limit: 100,
            }
          }
        })
        */


        //const threads = await get_threads(room.roomId);
        //console.log(threads)

        //const messagesResult = await client.createMessagesRequest(room.roomId, null, 100, 'b', filter);
        //const messages = messagesResult.chunk;
        //console.log(`Fetched ${messages.length} messages using createMessagesRequest`);
      }

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

        sync_state.last_sync = new Date();

        nextSyncToken = data.nextSyncToken;

        synced = true
        //console.log(client.store)

        let logged_in_user = client.store.getUser(client.getUserId());
        user = logged_in_user;


        Object.keys(client.store.rooms).forEach((roomId) => {
          const room = client.getRoom(roomId);
          rooms[roomId] = room;
        });

        getMailboxRooms();

      }
    });



    let filter = sdk.Filter.fromJson(null, "test", {
      room: {
        timeline: {
          unread_thread_notifications: true,
          limit: 1,
        }
      }
    })

    await client.startClient({
      //filter: filter,
      //fullState: true,
      //initialSyncLimit: 1000,
      lazyLoadMembers: true,
      disablePresence: true,
      //threadSupport: true,
      resolveInvitesToProfiles: true,
    });


  }

  async function getMailboxRooms() {
    let inbox = await client.getAccountDataFromServer("matrixbird.room.inbox");
    if(inbox?.room_id) {
      mailbox_rooms.inbox = inbox.room_id;
    }
    let self = await client.getAccountDataFromServer("matrixbird.room.self");
    if(self?.room_id) {
      mailbox_rooms.self = self.room_id;
    }
    let drafts = await client.getAccountDataFromServer("matrixbird.room.drafts");
    if(drafts?.room_id) {
      mailbox_rooms.drafts = drafts.room_id;
    }
  }

  async function syncOnce(){
    await client.once(sdk.ClientEvent.sync, function (state, prevState, res) {
      if (state === "PREPARED") {
        console.log("prepared");
      }
    });
  }



  function getUser(user_id){
    return client.store.getUser(user_id)
  }


  async function doesRoomExist(userIds) {
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
        if (event.getContent().membership === "invite") {
          invitedMembers.push({ userId: event.getStateKey() });
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

  const emailRoom = async (userIds) => {

    const existingRoomId = await doesRoomExist(userIds);

    if (existingRoomId) {
      console.log(`Found existing DM room with ${userIds}: ${existingRoomId}`);
      return existingRoomId;
    }

    console.log(`No existing DM room found with ${userIds}, creating one...`);

    // Create a new DM room
    const createRoomResult = await client.createRoom({
      preset: 'private_chat',
      invite: userIds,
      visibility: 'private',
      /*
      power_level_content_override: {
        events: {
          'matrixbird.email.matrix': 100,
        }
      },
      */
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
        /*
        {
          type: 'matrixbird.email.matrix',
          state_key: 'initial',
          content: initMsg
        }
        */
      ]
    });

    const newRoomId = createRoomResult.room_id;

    //created_rooms[userId] = newRoomId;

    console.log(`Created new DM room with ${userIds}: ${newRoomId}`);

    return newRoomId;
  };


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

    updateSession,
    createMatrixClient,
    getUser,
    syncOnce,
    doesRoomExist,
    emailRoom,
  };
}

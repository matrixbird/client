import * as sdk from 'matrix-js-sdk';
import { SvelteMap } from 'svelte/reactivity';
import { browser } from '$app/environment';

import { updateAppStatus } from '$lib/store/store.svelte.js';

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

let events = $state(new SvelteMap());

export let status = $state({
  events_ready: false,
});

let created_rooms = $state({});

export let sync = $state({
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

    client.on(sdk.RoomEvent.MyMembership, function (room, membership, prev) {
      if (membership === sdk.KnownMembership.Join) {
        //console.log("joined", room.roomId)
      }
      if (membership === sdk.KnownMembership.Invite) {
        let is_local = is_local_room(room.roomId);
        if(is_local) {
          console.log("is local room")
          join_local_room(room.roomId)
        } else {
          setTimeout(() => {
            join_room(room.roomId);
          }, 2000)
        }
      }
    });


    async function join_local_room(roomId) {
      console.log("Joining local room:", roomId);
      let room = await client.joinRoom(roomId, {
        syncRoom: true,
      });
      console.log("Joined local room:", room);
    }

    async function join_room(roomId) {

      let exists = rooms[roomId];
      if(exists) {
        console.log("Already joined room:", roomId);
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
              events.set(message.event_id, message);
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
      if(event?.event) {
        let event_type = event.event.type;
        if (event_type.includes("matrixbird.email")) {

          let isSending = event.isSending();

          if(isSending) {
            setTimeout(() => {
              events.set(event.event.event_id, event.event);
            }, 1000)
          }

          if(!isSending) {
            events.set(event.event.event_id, event.event);
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
    });

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
      const url = `${PUBLIC_HOMESERVER}/_matrix/client/v1/rooms/${roomId}/threads`;

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

    async function buildEvents() {
      let rooms = client.getRooms();

      for (const room of rooms) {

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

        const threads = await get_threads(room.roomId);
        console.log(threads)

        //const messagesResult = await client.createMessagesRequest(room.roomId, null, 100, 'b', filter);
        //const messages = messagesResult.chunk;
        //console.log(`Fetched ${messages.length} messages using createMessagesRequest`);
      }

      ready = true

    }


    client.on("sync", (state, prevState, data) => {

      sync.state = state;

      if (state === "ERROR") {
        sync.last_retry = new Date();
        updateAppStatus("Failed to sync.")
      }

      if (state === "SYNCING") {
        //updateAppStatus("Syncing...")
      }

      if (state === "RECONNECTING") {
        sync.last_retry = new Date();
      }

      if(state === "PREPARED") {
        buildEvents()
        updateAppStatus("Connected.")

        setTimeout(() => {
          updateAppStatus(null)
        }, 2000)

        sync.last_sync = new Date();

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



    await client.startClient({
      initialSyncLimit: 1000,
      lazyLoadMembers: false,
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

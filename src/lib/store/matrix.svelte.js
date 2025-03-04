import * as sdk from 'matrix-js-sdk';
import { SvelteMap } from 'svelte/reactivity';
import { browser } from '$app/environment';

import { 
  PUBLIC_HOMESERVER,
} from '$env/static/public';
import { v4 as uuidv4 } from 'uuid';

import { get_messages } from '$lib/appservice/api'

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


export function createMatrixStore() {

  function updateSession(data) {
    session = data
  }

  async function createMatrixClient(opts) {
    console.info("Creating matrix client.", opts)

    if(!opts?.access_token || !opts?.user_id || !opts?.device_id) {
      console.error("No session provided.")
      return;
    }

    session = opts

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
    } catch(e) {
      console.log("Error getting whoami", e)
      if(e.errcode === "M_UNKNOWN_TOKEN") {
        console.log("logging out")
      }
    }

    client.on(sdk.RoomEvent.MyMembership, function (room, membership, prev) {
      if (membership === sdk.KnownMembership.Invite) {
        //console.log("got invited", room)
        console.log("membership", membership)
        console.log("prev", prev)
        join_room(room.roomId);
      }
    });



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
        console.log("joined room:", room)

        /*
        setTimeout(async () => {



        await client.scrollback(storedRoom, 50).then((x) => {
          console.log("Fetched previous messages", x);
        });


        const events = storedRoom.getLiveTimeline().getEvents();
        console.log(events)
        if (events.length > 0) {
          const latestEvent = events[events.length - 1];
          const read = await client.sendReceipt(latestEvent, "m.read", {thread: "main"});
          console.log("read", read)
        }


        await client.roomInitialSync(room.roomId, 25).then(() => {
          console.log("Room initial sync complete");
        });


        const messagesResult = await client.createMessagesRequest(room.roomId, null, 100, 'b', null);
        const messages = messagesResult.chunk;
        console.log(`Fetched ${messages.length} messages using createMessagesRequest`);


        console.log("Room join and sync complete for:", room.roomId);
        }, 3000)

        */



      } catch (error) {
        console.error("Error joining room:", roomId, error);
      }
    }

    client.on(sdk.RoomMemberEvent.Membership, function (event, room, toStartOfTimeline) {
      //console.log(event)
    });

    client.on(sdk.UserEvent.DisplayName, function (event, room, toStartOfTimeline) {
      //console.log(event?.event)
    });

    client.on(sdk.UserEvent.AvatarUrl, function (event, room, toStartOfTimeline) {
      //console.log(event?.event)
    });


    client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
      if(event?.event) {
        let event_type = event.event.type;
        if (event_type === "matrixbird.email.legacy" || 
          event_type === "matrixbird.email.native") {

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
        if (event_type === "matrixbird.email.native") {
          let exists = events.find((e) => e.event_id === event.event.event_id);
          if(!exists) {
            events.push(event.event);
          }
        }
        //console.log(event.event)
      }
    });
    */


    function buildEvents() {
      let rooms = client.getRooms();
      rooms.forEach((room) => {
        const timeline = room.getLiveTimeline();
        timeline.getEvents().forEach((event) => {
          let event_type = event.getType();
          if (event_type === "matrixbird.email.legacy" || 
            event_type === "matrixbird.email.native") {
            events.set(event.getId(), event.event);
          }
        });
      });
      //status.events_ready = true;
      //ready = true
    }


    client.on("sync", (state, prevState, data) => {

      sync.state = state;

      if (state === "ERROR") {
        sync.last_retry = new Date();
      }

      if (state === "SYNCING") {
      }

      if (state === "RECONNECTING") {
        sync.last_retry = new Date();
      }

      if(state === "PREPARED") {

        sync.last_sync = new Date();

        nextSyncToken = data.nextSyncToken;

        synced = true
        //console.log(client.store)

        let logged_in_user = client.store.getUser(client.getUserId());
        user = logged_in_user;


        //buildEvents()


        /*
        const items = client.getRooms();
        items.forEach((room) => {
          const timeline = room.getLiveTimeline();
          //console.log(timeline);
        });

        Object.keys(client.store.rooms).forEach((roomId) => {
          const room = client.getRoom(roomId);
          const alias = room.getCanonicalAlias();
          //console.log(alias);
          client.getRoom(roomId).timeline.forEach((t) => {
            //console.log(t.event);
          });
        });

        //console.log(client);
        console.log(rooms);
        */

        Object.keys(client.store.rooms).forEach((roomId) => {
          const room = client.getRoom(roomId);
          rooms[roomId] = room;
        });

        ready = true
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

  function findEmailRooms() {

    const stateKey = ''
    // Get all rooms the client knows about
    const allRooms = client.getRooms();

    // Filter rooms that have the specific state event
    const rooms = allRooms.filter(room => {
      // Check if the room has the state event with the given state key
      const stateEvent = room.currentState.getStateEvents('matrixbird.room.type', stateKey);
      if (!stateEvent) return false;

      // Check if the event content matches the filter
      const content = stateEvent.getContent();

      const contentFilter = {
        type: 'email'
      };

      // For each key in contentFilter, check if the content has the same value
      return Object.entries(contentFilter).every(([key, value]) => 
        content[key] === value
      );
    });

    return rooms;
  }

  function emailRoomMembers(client, contentFilter = null, stateKey = '', removeDuplicates = true) {
    // Find rooms matching our criteria
    const matchingRooms = findEmailRooms();

    // If no rooms match, return an empty array
    if (matchingRooms.length === 0) {
      return [];
    }

    // Get all members from all matching rooms
    let allMembers = [];

    matchingRooms.forEach(room => {
      // Get all members from this room
      const roomMembers = room.getMembers();
      allMembers = allMembers.concat(roomMembers);
    });

    return allMembers;
  }


  async function doesRoomExist(userIds) {
    // Get all rooms the logged-in user is in
    const rooms = client.getRooms();

    // Include the current user in our check if not already included
    const currentUserId = client.getUserId();
    const allRelevantUserIds = [...new Set([...userIds, currentUserId])];

    for (const room of rooms) {
      // Check if the room has the required state event
      const stateEvent = room.currentState.getStateEvents("matrixbird.room.type", "");
      if (!stateEvent || stateEvent.getContent().type !== "email") continue;

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
          'matrixbird.email.native': 100,
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
          state_key: '',
          content: {
            type: 'email'
          }
        },
        /*
        {
          type: 'matrixbird.email.native',
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
    findEmailRooms,
    emailRoomMembers,
    doesRoomExist,
    emailRoom,
  };
}

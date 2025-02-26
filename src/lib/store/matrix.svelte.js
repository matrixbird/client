import { 
  PUBLIC_HOMESERVER,
} from '$env/static/public';
import { v4 as uuidv4 } from 'uuid';

let ready = $state(false);
let synced = $state(false);
let session = $state(null);
let msg = $state(null);

let user = $state(null);

let client = $state(null);
let sdk;
let loaded = $state(false);

let rooms = $state({});
let members = $state([]);
let events = $state([]);

let created_rooms = $state({});


export function createMatrixStore() {

  function updateSession(data) {
    session = data
  }

  async function createMatrixClient() {
    console.log("creating matrix client")

    sdk = await import('matrix-js-sdk');
    loaded = true;
    client =  sdk.createClient({
      baseUrl: PUBLIC_HOMESERVER,
      accessToken: session?.access_token,
      userId: session.user_id,
      deviceId: session.device_id,
      supportsCallTransfer: false,
      useE2eForGroupCall: false
    });

    try {
      const whoami = await client.whoami()
      //console.log(whoami);
    } catch(e) {
      if(e.errcode === "M_UNKNOWN_TOKEN") {
        console.log("logging out")
      }
    }

    client.on(sdk.RoomEvent.MyMembership, function (room, membership, prevMembership) {
      if (membership === sdk.KnownMembership.Invite) {
        console.log(room)
        join_room(room);
      }
    });

    async function join_room(room) {
      try {
        // Get all currently joined rooms
        const joinedRooms = client.getRooms().filter(r => 
          r.getMyMembership() === "join"
        ).map(r => r.roomId);

        //console.log(joinedRooms)
        // Check if we're already in this room
        if (joinedRooms.includes(room.roomId)) {
          console.log("Already joined room:", room.roomId);
          return;
        }

        // Join the room since we're not already in it
        console.log("Joining room:", room.roomId);
        let joined = await client.joinRoom(room.roomId);
        console.log("joined", joined)

        let storedRoom = await client.getRoom(room.roomId);
        console.log("room from store is", storedRoom)
        rooms[room.roomId] = storedRoom;

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
        console.error("Error joining room:", room.roomId, error);
      }
    }


    client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
      if(event?.event) {
        let event_type = event.event.type;
        if (event_type === "matrixbird.email.legacy" || 
          event_type === "matrixbird.email.native") {
          let exists = events.find((e) => e.event_id === event.event.event_id);
          if(!exists) {
            events.push(event.event);
          }
        }
        //console.log(event.event)
      }
    });

    client.on(sdk.RoomMemberEvent.Membership, function (event, room, toStartOfTimeline) {
      if(event?.event?.content?.membership == "join") {
        //console.log(event.event)
      }
    });


    client.on("sync", (state, prevState, data) => {
      if(state === "PREPARED") {

        console.log(data)

        synced = true
        //console.log(client.store)

        let logged_in_user = client.store.getUser(client.getUserId());
        user = logged_in_user;
        //console.log("saving user", user)


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
        */
        Object.keys(client.store.rooms).forEach((roomId) => {
          const room = client.getRoom(roomId);
          rooms[roomId] = room;
        });
        console.log(rooms);
        ready = true
      }
    });

    await client.startClient({
      initialSyncLimit: 1000,
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
    // First check if a DM room already exists

    const existingRoomId = await doesRoomExist(userIds);

    if (existingRoomId) {
      console.log(`Found existing DM room with ${userIds}: ${existingRoomId}`);
      return existingRoomId;
    }

    console.log(`No existing DM room found with ${userIds}, creating one...`);

    // Create a new DM room
    const createRoomResult = await client.createRoom({
      preset: 'trusted_private_chat',
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
          type: 'matrixbird.room.type',
          state_key: '',
          content: {
            type: 'email'
          }
        }
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

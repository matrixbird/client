import { 
  PUBLIC_HOMESERVER,
} from '$env/static/public';
//import { v4 as uuidv4 } from 'uuid';

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
        client.joinRoom(room.roomId).then(function () {
          console.log("Auto-joined %s", room.roomId);
        });
      }


    });


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

    client.on("sync", (state, prevState, data) => {
      if(state === "PREPARED") {

        synced = true
        console.log(client.store)

        let logged_in_user = client.store.getUser(client.getUserId());
        user = logged_in_user;
        console.log("saving user", user)


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

        Object.keys(client.store.rooms).forEach((roomId) => {
          const room = client.getRoom(roomId);
          rooms[roomId] = room;
        });
        console.log(rooms);
        //console.log(client);
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

  // Assuming you already have an authenticated client
  const findDMUsers = async () => {
    // Wait for initial sync to complete
    if (client.isInitialSyncComplete()) {
      return getDMUsers();
    } else {
      client.once('sync', (state) => {
        if (state === 'PREPARED') {
          return getDMUsers();
        }
      });
    }

    function getDMUsers() {
      // Method 1: Using m.direct account data (official way)
      const directData = client.getAccountData('m.direct');
      const directRooms = directData ? directData.getContent() : {};

      // Method 2: Find rooms with exactly two members (more reliable in some cases)
      const rooms = client.getRooms();
      const twoMemberRooms = rooms.filter(room => {
        const members = room.getJoinedMembers();
        return members.length === 2 && 
          members.some(member => member.userId === client.getUserId());
      });

      const dmPartners = twoMemberRooms.map(room => {
        const members = room.getJoinedMembers();
        return members.find(member => member.userId !== client.getUserId()).userId;
      });

      // Combined comprehensive list
      const allDMUsers = new Set([
        ...Object.keys(directRooms),
        ...dmPartners
      ]);

      return Array.from(allDMUsers);
    }
  };

  const DMUserExists = async (user) => {
    console.log(user)
    const dmUsers = await findDMUsers();
    console.log(dmUsers)
    return dmUsers.includes(user);
  }


  function getUser(user_id){
    return client.store.getUser(user_id)
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
    findDMUsers,
    DMUserExists,
  };
}

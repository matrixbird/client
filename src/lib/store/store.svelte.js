import { createUIStore } from './ui.svelte.js';

import { 
  PUBLIC_HOMESERVER,
} from '$env/static/public';

let ready = $state(false);
let session = $state(null);

let matrixClient = $state(null);
let sdk;
let loaded = $state(false);

let rooms = $state({});
let members = $state([]);
let events = $state([]);

export function createStore() {

  function updateSession(data) {
    session = data
  }

  async function createMatrixClient() {
    console.log("creating matrix client")


    sdk = await import('matrix-js-sdk');
    loaded = true;
    matrixClient =  sdk.createClient({
      baseUrl: PUBLIC_HOMESERVER,
      accessToken: session?.access_token,
      userId: session.user_id,
      deviceId: session.device_id,
    });

    try {
      const whoami = await matrixClient.whoami()
      console.log(whoami);
    } catch(e) {
      if(e.errcode === "M_UNKNOWN_TOKEN") {
        console.log("logging out")
      }
    }

    matrixClient.on(sdk.RoomEvent.MyMembership, function (room, membership, prevMembership) {
      if (membership === sdk.KnownMembership.Invite) {
          matrixClient.joinRoom(room.roomId).then(function () {
              console.log("Auto-joined %s", room.roomId);
          });
      }


});

    await matrixClient.startClient({
      initialSyncLimit: 1000,
    });



    matrixClient.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
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

    matrixClient.on("sync", (state, prevState, data) => {
      if(state === "PREPARED") {


        const items = matrixClient.getRooms();
        items.forEach((room) => {
          const timeline = room.getLiveTimeline();
          //console.log(timeline);
        });

        Object.keys(matrixClient.store.rooms).forEach((roomId) => {
          const room = matrixClient.getRoom(roomId);
          const alias = room.getCanonicalAlias();
          //console.log(alias);
          matrixClient.getRoom(roomId).timeline.forEach((t) => {
            //console.log(t.event);
          });
        });

        Object.keys(matrixClient.store.rooms).forEach((roomId) => {
          const room = matrixClient.getRoom(roomId);
          rooms[roomId] = room;
        });
          console.log(rooms);
        //console.log(matrixClient);
        ready = true
      }
    });
  }

  function getUser(user_id){
    return matrixClient.store.getUser(user_id)
  }

  return {

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

		get ui() {
			return createUIStore();
		},

    updateSession,
    createMatrixClient,
    getUser

  };
}

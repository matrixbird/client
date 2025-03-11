import { PUBLIC_HOMESERVER, PUBLIC_HOMESERVER_NAME } from '$env/static/public';

export const getStateEvent = async (token, roomId, eventType, stateKey) => {
  let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/state/${eventType}`;
  if(stateKey) {
    url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/state/${eventType}/${stateKey}`;
  }

  let options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const getEvent = async (token, roomId, eventId) => {
  let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/event/${eventId}`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const syncOnce = async (token) => {

  let filter = {
    account_data: {
      types: ["matrixbird.mailbox.rooms"],
      limit: 1,
    },
    room: {
      timeline: {
        unread_thread_notifications: true,
        limit: 0,
      },
      state: {
        types: ["matrixbird.room.type","matrixbird.email.pending"],
        limit: 2,
      },
      include_leave: true,
    }
  }

  let encoded = encodeURIComponent(JSON.stringify(filter));

  let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/sync?filter=${encoded}`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const getRoomState = async (token, roomId ) => {
  let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/state`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const downloadContent = async (token, mxcid ) => {

  let stripped = mxcid.replace('mxc://', '');

  let url = `${PUBLIC_HOMESERVER}/_matrix/client/v1/media/download/${stripped} `;

  let options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }

  try {
    const response = await fetch(url, options)
    return response.text();
  } catch (error) {
    throw error
  }
}

export const getThumbnail = async (token, mxcid ) => {

  let stripped = mxcid.replace('mxc://', '');

  let url = `${PUBLIC_HOMESERVER}/_matrix/client/v1/media/thumbnail/${stripped}?height=96&width=96&method=scale`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }

  try {
    const response = await fetch(url, options)
    return response?.url;
  } catch (error) {
    throw error
  }
}


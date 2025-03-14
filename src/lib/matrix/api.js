import { PUBLIC_HOMESERVER, PUBLIC_HOMESERVER_NAME } from '$env/static/public';


export const get_threads = async (token, roomId) => {
  const url = `${PUBLIC_HOMESERVER}/_matrix/client/v1/rooms/${roomId}/threads?limit=50`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}


export const get_thread_root_event = async (token, roomId, eventId) => {
  const url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/event/${eventId}`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}

export const get_thread_events = async (token, roomId, eventId) => {
  const url = `${PUBLIC_HOMESERVER}/_matrix/client/v1/rooms/${roomId}/relations/${eventId}/m.thread?limit=50`;

  let options = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  }

  try {
    const response = await fetch(url, options)
    return response.json();
  } catch (error) {
    throw error
  }

}


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
      ephemeral: {
        types: ["m.receipt"],
        limit: 1,
        unread_thread_notifications: true,
      },
      timeline: {
        unread_thread_notifications: true,
        limit: 0,
      },
      state: {
        types: ["matrixbird.room.type", "matrixbird.email.pending", "m.room.member"],
        limit: 100,
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

export const getAccountData = async (token, userId, type ) => {
  let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/user/${userId}/account_data/${type}`;

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


export const sendReadReceipt = async (token, roomId, eventId, body ) => {
  let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/receipt/m.read/${eventId}`;

  let options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }

  if (body) {
    options.body = JSON.stringify(body);
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


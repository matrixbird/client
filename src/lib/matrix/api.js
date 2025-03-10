import { PUBLIC_HOMESERVER } from '$env/static/public';

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
        types: ["matrixbird.email.pending"],
        limit: 1,
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


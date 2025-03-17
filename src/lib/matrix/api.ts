import { PUBLIC_HOMESERVER } from '$env/static/public';

export const getThreads = async (token: string | undefined, roomId: string) => {
    if(!token) {
        throw new Error('No token provided');
    }

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


export const getThreadRootEvent = async (token: string | undefined, roomId: string, eventId: string) => {
    if(!token) {
        throw new Error('No token provided');
    }

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

export const getThreadEvents = async (token: string | undefined, roomId: string, eventId: string) => {
    if(!token) {
        throw new Error('No token provided');
    }

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


export const getStateEvent = async (token: string | undefined, roomId: string, eventType: string, stateKey: string | null) => {

    if(!token) {
        throw new Error('No token provided');
    }

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

export const getEvent = async (token: string | undefined, roomId: string, eventId: string) => {
    if(!token) {
        throw new Error('No token provided');
    }

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

export const syncOnce = async (token: string | undefined) => {

    if(!token) {
        throw new Error('No token provided');
    }


    let filter = {
        account_data: {
            types: ["matrixbird.mailbox.rooms", "matrixbird.client.settings.ui"],
            limit: 2,
        },
        room: {
            ephemeral: {
                types: ["m.receipt"],
                limit: 1000,
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

export const getRoomState = async (token: string | undefined, roomId: string ) => {
    if(!token) {
        throw new Error('No token provided');
    }

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

export const getAccountData = async (token: string | undefined, userId: string | undefined, type: string ) => {

    if(!token || !userId) {
        throw new Error('No token provided');
    }

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

interface FetchOptions {
    method: string;
    headers: {
        'Content-Type': string;
        'Authorization': string;
    };
    body?: string;

}

export const sendReadReceipt = async (token: string, roomId: string, eventId: string, body: object | null ) => {
    let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/receipt/m.read/${eventId}`;

    let options: FetchOptions = {
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


export const downloadContent = async (token: string, mxcid: string ) => {

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

export const getThumbnail = async (token: string, mxcid: string ) => {

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


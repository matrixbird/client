import { PUBLIC_HOMESERVER } from '$env/static/public';
import { session } from '$lib/store/session.svelte';

export const getThreads = async (roomId: string) => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
    }

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


export const getThreadRootEvent = async (roomId: string, eventId: string) => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
    }

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

export const getThreadEvents = async (roomId: string, eventId: string) => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
    }

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


export const getStateEvent = async (roomId: string, eventType: string, stateKey: string | null) => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
    }


    let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/state/${eventType}`;
    if(stateKey) {
        url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/state/${eventType}/${stateKey}`;
    }

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

export const getEvent = async (roomId: string, eventId: string) => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
    }

    let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/event/${eventId}`;

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

export const syncOnce = async () => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
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

export const slidingSync = async (conn_id: string) => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
    }

    let body = {
        conn_id: conn_id,
        lists: {
            emails: {
                ranges: [[0, 50]],
                filters: {
                    //tags: ["matrixbird.important"],
                    //"not_tags": ["matrixbird.ignore"]
                    is_dm: false
                },
                timeline_limit: 100,
                include_heroes: true,
                sort: ["by_recency"],
                required_state: [
                    ["*", "*"],
                    //["matrixbird.room.type", "*"],
                    //["m.room.member", "*"]
                ],
                bump_event_types: [ "matrixbird.email.matrix", "matrixbird.email.standard", "matrixbird.email.reply", "matrixbird.thread.marker" ]
            }
        },
        extensions: {
            threads: {
                enabled: true
            },
            to_device: {
                enabled: true
            },
            receipts: {
                enabled: true
            },
            account_data: {
                enabled: true
            }
        }
    }


    let url = `${PUBLIC_HOMESERVER}/_matrix/client/unstable/org.matrix.simplified_msc3575/sync`;

    let options = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        method: 'POST',
        body: JSON.stringify(body)
    }

    try {
        const response = await fetch(url, options)
        return response.json();
    } catch (error) {
        throw error
    }

}

export const getRoomState = async (roomId: string ) => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
    }

    let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/state`;

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

export const getAccountData = async (account_data_type: string ) => {

    if(!session.access_token || !session.user_id) {
        throw new Error('Access token is missing.');
    }

    let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/user/${session.user_id}/account_data/${account_data_type}`;

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

interface FetchOptions {
    method: string;
    headers: {
        'Content-Type': string;
        'Authorization': string;
    };
    body?: string;

}

export const sendReadReceipt = async (roomId: string, eventId: string, body: object | null ) => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
    }


    let url = `${PUBLIC_HOMESERVER}/_matrix/client/v3/rooms/${roomId}/receipt/m.read/${eventId}`;

    let options: FetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
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


export const downloadContent = async (mxcid: string ) => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
    }

    let stripped = mxcid.replace('mxc://', '');

    let url = `${PUBLIC_HOMESERVER}/_matrix/client/v1/media/download/${stripped} `;

    let options = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
    }

    try {
        const response = await fetch(url, options)
        return response.text();
    } catch (error) {
        throw error
    }
}

export const getThumbnail = async (mxcid: string ) => {

    if(!session.access_token) {
        throw new Error('Access token is missing.');
    }

    let stripped = mxcid.replace('mxc://', '');

    let url = `${PUBLIC_HOMESERVER}/_matrix/client/v1/media/thumbnail/${stripped}?height=96&width=96&method=scale`;

    let options = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
    }

    try {
        const response = await fetch(url, options)
        return response?.url;
    } catch (error) {
        throw error
    }
}


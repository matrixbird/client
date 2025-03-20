import { PUBLIC_HOMESERVER } from '$env/static/public';
import { session } from '$lib/store/session.svelte';
import { v4 as uuidv4 } from 'uuid';

import { processSync } from '$lib/store/process.svelte';

let sync_state: {
    timeout: number,
    pos: number | undefined,
    conn_id: string | undefined,
    is_running: boolean,
} = $state({
    timeout: 30000,
    pos: undefined,
    conn_id: uuidv4(),
    is_running: false,
})

export function newSlidingSync() {

    const sync = async () => {

        if(!session.access_token) {
            throw new Error('Access token is missing.');
        }

        let body = {
            conn_id: sync_state.conn_id,
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


        let url = `${PUBLIC_HOMESERVER}/_matrix/client/unstable/org.matrix.simplified_msc3575/sync?timeout=${sync_state.timeout}`;

        if(sync_state.pos) {
            url = `${PUBLIC_HOMESERVER}/_matrix/client/unstable/org.matrix.simplified_msc3575/sync?pos=${sync_state.pos}&timeout=${sync_state.timeout}`;
        }


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


    async function poll() {
        if(!sync_state.is_running) {
            return;
        }
        try {
            let resp = await sync();
            if(resp?.pos) {
                console.log("next pos", resp.pos);
                processSync(resp);
                sync_state.pos = resp.pos;
            }
            poll();
        } catch (error) {
            console.error(error);
            if(sync_state.is_running) {
                sync_state.pos = undefined;
                setTimeout(() => poll(), 5000);
            }
        }
    }

    function start() {
        if(sync_state.is_running) {
            return;
        }
        sync_state.is_running = true;
        poll();

        return { stop }
    }

    function stop() {
        sync_state.pos = undefined;
        sync_state.is_running = false;
    }

    return {
        start,
        stop
    }

}


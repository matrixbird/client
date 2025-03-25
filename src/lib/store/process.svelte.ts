import { session, type Session } from '$lib/store/session.svelte';
import { SvelteMap } from 'svelte/reactivity';
import { MatrixClient } from 'matrix-js-sdk/src/index';
import type { IStore } from 'matrix-js-sdk/src/store';
import type { 
    MatrixEvent,
    Emails,
    Threads,
    ThreadEvents
} from '$lib/types/matrixbird';

import type { MSC3575SlidingSyncResponse as SyncResponse } from 'matrix-js-sdk/src/sliding-sync';

import {
    is_local_room
} from '$lib/utils/matrix'


import { 
    syncProcessed,
    events,
    threads,
    thread_events,
    read_events, 
    mailbox_rooms,
    users,
    join_room
} from '$lib/store/matrix.svelte'


export function buildInboxEmails(session: Session, threads: Threads, thread_events: ThreadEvents) {

    function findLastNonUserEvent(threadEvents: MatrixEvent[]) {
        //const nonUserEvents = threadEvents.filter((event: MatrixEvent) => event.sender !== session.user_id);
        const nonUserEvents = threadEvents.filter((event: MatrixEvent) => event.content?.recipients?.includes(session.user_id) || event.sender !== session.user_id);

        if (nonUserEvents.length === 0) return null;

        return nonUserEvents.reduce((latest, current) => 
            current.origin_server_ts > latest.origin_server_ts ? current : latest, 
            nonUserEvents[0]);
    }


    let emails: Emails = {};

    for (const [threadId, thread] of threads) {
        let children = thread_events.get(threadId);
        // this thread has event relations, we'll need to process 
        // them to find the latest reply from another sender
        if(children) {
            let nonUserReply = findLastNonUserEvent(children);
            if(nonUserReply) {
                emails[nonUserReply.event_id] = nonUserReply;
            } else {
                // this may be an email chain started by another user but 
                // all child events are sent by this user, so we'll 
                // return the original thread event
                emails[threadId] = thread;
            }
        }
        // this thread has no event relations, so this is either
        // an email sent by this user or recieved from another user
        // add to inbox if it's not sent by this user
        if(!children) {
            if(thread.content?.recipients?.includes(session.user_id) || thread.sender != session.user_id) {
                emails[threadId] = thread;
            }
        }
    }
    //console.log("inbox built", emails)

    let sorted = Object.values(emails).sort((a, b) => {
        return b.origin_server_ts - a.origin_server_ts
    })

    return sorted
}

export function buildSentEmails(
    session: Session, 
    threads: Threads, 
    thread_events: ThreadEvents,
) {

    function findLastUserEvent(threadEvents: MatrixEvent[]) {
        const userEvents = threadEvents.filter(event => event.sender === session.user_id);

        if (userEvents.length === 0) return null;

        return userEvents.reduce((latest, current) => 
            current.origin_server_ts > latest.origin_server_ts ? current : latest, 
            userEvents[0]);
    }

    let emails: Emails = {};

    for (const [threadId, thread] of threads) {
        let children = thread_events.get(threadId);
        // this thread has event relations, we'll need to process 
        // them to find the latest reply from this user
        if(children) {
            let userReply = findLastUserEvent(children);
            if(userReply) {
                emails[userReply.event_id] = userReply;
            } else {
                // this may be an email chain started by this user and
                // all child events are sent by this user, so we'll 
                // return the original thread event
                if(thread.sender == session.user_id) {
                    emails[threadId] = thread;
                }
            }
        }
        // this thread has no event relations, so this is either
        // an email sent by this user or recieved from another user
        // add to inbox if it's sent by this user
        if(!children) {
            if(thread.sender == session.user_id) {
                emails[threadId] = thread;
            }
        }
    }
    //console.log("inbox built", emails)

    let sorted = Object.values(emails).sort((a, b) => {
        return b.origin_server_ts - a.origin_server_ts
    })

    return sorted

}


export async function processSync(sync: SyncResponse) {
    // Build Mailbox Rooms
    let globalAccountData = sync?.extensions?.account_data?.global || {};
    Object.values(globalAccountData)
        .filter(data => data?.type === "matrixbird.mailbox.rooms")
        .flatMap(data => {
            const content = data?.content || {};
            Object.entries(content)
                .forEach(([key, value]) => {
                    if(typeof value === "string") {
                        mailbox_rooms[key] = value;
                    }
                });
        });

    // Build read events
    let receipts = sync?.extensions?.receipts?.rooms || {};
    Object.values(receipts)
        .filter(data => data?.type === "m.receipt")
        .flatMap(data => {
            const content = data?.content || {};
            Object.entries(content)
                .forEach(([event_id, value]) => {
                    let thread_id = value?.["m.read"]?.[session.user_id]?.["thread_id"];
                    if(thread_id && thread_id != "main") {
                        //read_events.set(event_id, thread_id);
                    }
                });
        });

    // Build threads
    let rooms = sync?.rooms || {};
    for (const [roomId, roomData] of Object.entries(rooms)) {

        let state = roomData?.required_state || [];
        state.forEach(event => {
            if(event.type === "m.room.member") {
                let content = {
                    displayname: event.content?.displayname,
                    avatar_url: event.content?.avatar_url
                }
                users.set(event.state_key, content);
            }
        });

        let timeline = roomData?.timeline || [];
        let types = [
            "matrixbird.email.matrix",
            "matrixbird.email.standard",
        ]

        Object.values(timeline)
            .filter(event => types.includes(event?.type))
            .forEach(event => {
                event.room_id = roomId;
                events.set(event.event_id, event);
                threads.set(event.event_id, event);
            });

        Object.values(timeline)
            .filter(event => event.type === "matrixbird.email.reply")
            .forEach(event => {
                event.room_id = roomId;
                let thread_id = event?.content?.["m.relates_to"]?.["event_id"];
                if(thread_id) {
                    //console.log("reply event", thread_id, event)
                    events.set(event.event_id, event);

                    let thread_event = threads.get(thread_id);

                    let _events = thread_events.get(thread_id) || [];
                    _events.push(event);
                    thread_events.set(thread_id, _events);
                }
            });
    }
    console.log("users are ", users)

    syncProcessed()
}

export async function process(client: MatrixClient) {
    console.log("Initial sync - process data.", client)



    Object.keys(client.store.rooms).forEach(async (roomId) => {
        const room = client.getRoom(roomId);

        const isLocal = is_local_room(roomId);


        let receipts = room.cachedThreadReadReceipts;

        receipts.forEach((val, event_id) => {
            val.forEach((e) => {
                if(e.userId == session.user_id) {
                    read_events.set(e.eventId, e?.receipt?.thread_id);
                }
            })

        })


        let _events = room.getLiveTimeline().getEvents();

        let _threads = _events.filter((event) => {
            return event.getType() === "matrixbird.email.matrix" || event.getType() === "matrixbird.email.standard";
        })

        if(!isLocal && _threads.length === 0) {
            console.log("This is a joined remote room that hasn't been synced yet.")

            //join_room(roomId);
            try {
                const res = await processNewEmailRoom(client, roomId);
                console.log("Processed remote email room", res)

            } catch (error) {
                console.error("Error fetching messages:", roomId, error);
            }
        }

        _threads.forEach((event) => {
            //console.log("Event", event);
            events.set(event.getId(), event.event);
            threads.set(event.getId(), event.event);

        });

        let replies = _events.filter((event) => {
            return event.getType() === "matrixbird.email.reply";
        })

        replies.forEach((event) => {
            let thread_id = event.event?.content?.["m.relates_to"]?.["event_id"];
            if(thread_id) {
                //console.log("reply event", thread_id, event)
                events.set(event.event.event_id, event.event);

                let eev = thread_events.get(thread_id) || [];
                eev.push(event.event);
                thread_events.set(thread_id, eev);
            }
        });
    });
    //console.log("threads are", _threads)
    //console.log("threads events are", _thread_events)
    //console.log("read events are", read_events)
    syncProcessed()
}

export async function processNewEmail(event: any) {
    console.log("Processing new email.", event)

    // We want events that have fully transactioned
    if(!event?.event?.unsigned) return

    event.event.new = true

    // Add to events and threads
    events.set(event.getId(), event.event);
    threads.set(event.getId(), event.event);

    // Add empty thread events
    thread_events.set(event.getId(), []);
}

export async function processNewEmailRoom(client: MatrixClient, roomId: string) {
    console.log("Processing new email room.", roomId)
    try {
        const messagesResult = await client.createMessagesRequest(roomId, null, 100, 'b', null);
        const messages = messagesResult.chunk;
        console.log(`Fetched ${messages.length} messages using createMessagesRequest`, messages);

        if(messages) {
            processMessages(messages);
        }


    } catch (error) {
        console.error("Error processing new email room:", roomId, error);
    }
}

function processMessages(messages: MatrixEvent[]) {
    console.log("Processing messages.", messages)

    let filtered: MatrixEvent[] = messages.filter((event) => {
        return event?.type === "matrixbird.email.matrix";
    })


    filtered.forEach((event) => {
        event.new = true
        // Add to events and threads
        events.set(event.event_id, event);
        threads.set(event.event_id, event);

        // Add empty thread events
        thread_events.set(event.event_id, []);
    });
}

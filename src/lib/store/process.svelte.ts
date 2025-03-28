import { session, type Session } from '$lib/store/session.svelte';
import { SvelteMap } from 'svelte/reactivity';
import { MatrixClient, EventTimeline, Direction, Room } from 'matrix-js-sdk/src/index';
import type { IRoomEvent } from 'matrix-js-sdk/src/sync-accumulator';
import type { IStore } from 'matrix-js-sdk/src/store';
import type { 
    MatrixEvent,
    Emails,
    Drafts,
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
    drafts,
    thread_events,
    read_events, 
    mailbox_rooms,
    users,
} from '$lib/store/matrix.svelte'


export function buildInboxEmails(session: Session, threads: Threads, thread_events: ThreadEvents) {

    function findLastNonUserEvent(threadEvents: IRoomEvent[]) {
        //const nonUserEvents = threadEvents.filter((event: MatrixEvent) => event.sender !== session.user_id);
        const nonUserEvents = threadEvents.filter((event: IRoomEvent) => event.content?.recipients?.includes(session.user_id) || event.sender !== session.user_id);

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

export function buildDraftEmails(drafts: Drafts) {
    let sorted = Object.values(drafts).sort((a, b) => {
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


export async function processMailboxRooms(event: MatrixEvent) {
    let content = event.getOriginalContent();
    Object.entries(content)
        .forEach(([key, value]) => {
            if(typeof value === "string") {
                mailbox_rooms[key] = value;
            }
        });
    console.log("Mailbox rooms processed:", $state.snapshot(mailbox_rooms))
}

// Process initial sync response
export async function process(client: MatrixClient) {

    const rooms = client.store.getRooms();

    for (const room of Object.values(rooms)) {

        const room_state = room?.getLiveTimeline().getState(EventTimeline.FORWARDS) 
        const room_type = room_state?.getStateEvents("matrixbird.room.type")?.[0]?.getContent()?.type;


        //const is_inbox = room_type === "INBOX";
        //const is_email = room_type === "EMAIL";
        const is_drafts = room_type === "DRAFTS";

        if(is_drafts) {
            processDrafts(room);
            continue;
        }


        const isLocal = is_local_room(room.roomId);

        let receipts = room?.cachedThreadReadReceipts;

        receipts?.forEach((val, event_id) => {
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
                const res = await processNewEmailRoom(client, room.roomId);
                console.log("Processed remote email room", res)

            } catch (error) {
                console.error("Error fetching messages:", room.roomId, error);
            }
        }

        _threads.forEach((event) => {
            let event_id = event.getId();
            if(typeof event_id === "string") {
                events.set(event_id, event.event);
                threads.set(event_id, event.event);
            }

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
                eev.push(event?.event);
                thread_events.set(thread_id, eev);
            }
        });
    };

    syncProcessed()
    console.log("Initial sync processed.")
}

export async function processDrafts(room: Room) {
    console.log("Processing drafts room events.", room)

    let _drafts = room.getLiveTimeline().getEvents();

    _drafts = _drafts.filter((event) => {
        return event.getType() === "matrixbird.email.draft";
    })


    _drafts.forEach((event) => {
        let event_id = event.getId();
        if(typeof event_id === "string") {
            drafts.push(event.event);
        }

    });
    console.log("Drafts events", $state.snapshot(drafts))
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
        const messagesResult = await client.createMessagesRequest(roomId, null, 100, Direction.Backward, undefined);
        const messages = messagesResult.chunk;
        console.log(`Fetched ${messages.length} messages using createMessagesRequest`, messages);

        if(messages) {
            processMessages(messages);
        }


    } catch (error) {
        console.error("Error processing new email room:", roomId, error);
    }
}

function processMessages(messages: IRoomEvent[]) {
    console.log("Processing messages.", messages)

    let filtered: IRoomEvent[] = messages.filter((event) => {
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

import type { Session } from '$lib/store/session.svelte';
import type { 
    MatrixEvent,
    Emails,
    Threads,
    ThreadEvents
} from '$lib/types/matrixbird';

export function buildInboxEmails(session: Session, threads: Threads, thread_events: ThreadEvents) {

  function findLastNonUserEvent(threadEvents: MatrixEvent[]) {
    const nonUserEvents = threadEvents.filter((event: MatrixEvent) => event.sender !== session.user_id);

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
      if(thread.sender != session.user_id) {
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


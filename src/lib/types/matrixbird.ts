import type { MatrixEvent, IEvent } from 'matrix-js-sdk/src/index'

export type { MatrixEvent };

export type Emails = Record<string, MatrixEvent>;

export type Drafts = Partial<IEvent>[];

export type Threads = Map<string, MatrixEvent>;
export type ThreadEvents = Map<string, MatrixEvent[]>;



export interface MailboxRooms {
    [key: string]: string;
}

export type EmailRoomCreationResponse = {
    exists: boolean,
    room_id: string,
}

export type DraftEventContent = {
    recipients?: string[];
    from?: {
        name?: string;
        address?: string;
    };
    subject?: string;
    body?: {
        text?: string;
        html?: string;
    };
}


export type EmailEventContent = {
    recipients: string[];
    from: {
        name?: string;
        address: string;
    };
    subject: string;
    body: {
        text: string;
        html: string;
    };
}

export type ThreadMarkerContent = {
    msgtype: "thread_marker";
    "m.relates_to": {
        event_id: string;
        "m.in_reply_to": string;
        rel_type: "m.thread";
    };
}

export interface UIState {
    expanded: boolean;
    sidebar_hidden: boolean;
}

export interface ComposerData {
    html: string;
    json: string;
    text: string;
    selection: number;
}

import type { AccountDataEvents, TimelineEvents } from "matrix-js-sdk/src/@types/event";

import type { 
    DraftEventContent,
    EmailEventContent, 
    ThreadMarkerContent,
    UIState,
    MailboxRooms
} from '$lib/types/matrixbird'

declare module "matrix-js-sdk/src/@types/event" {
    interface AccountDataEvents {
        "matrixbird.client.settings.ui": UIState;
        "matrixbird.mailbox.rooms": MailboxRooms;
    }
    interface TimelineEvents {
        "matrixbird.email.matrix": EmailEventContent;
        "matrixbird.email.draft": DraftEventContent,
        "matrixbird.thread.marker": ThreadMarkerContent;
    }
}

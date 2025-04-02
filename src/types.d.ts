import type { AccountDataEvents, TimelineEvents } from "matrix-js-sdk/src/@types/event";

import type { 
    DraftEventContent,
    EmailEventContent, 
    ThreadMarkerContent,
    UIState,
    ClientUISettings,
    MailboxRooms
} from '$lib/types/matrixbird'

declare module "matrix-js-sdk/src/@types/event" {
    interface AccountDataEvents {
        "matrixbird.client.settings.ui": ClientUISettings;
        "matrixbird.mailbox.rooms": MailboxRooms;
    }
    interface TimelineEvents {
        "matrixbird.email.matrix": EmailEventContent;
        "matrixbird.email.draft": DraftEventContent,
        "matrixbird.thread.marker": ThreadMarkerContent;
    }
}

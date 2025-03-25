import type { AccountDataEvents, TimelineEvents } from "matrix-js-sdk/src/@types/event";

import type { 
    EmailEventContent, 
    ThreadMarkerContent,
    UIState 
} from '$lib/types/matrixbird'

declare module "matrix-js-sdk/src/@types/event" {
    interface AccountDataEvents {
        "matrixbird.client.settings.ui": UIState;
    }
    interface TimelineEvents {
        "matrixbird.email.matrix": EmailEventContent;
        "matrixbird.thread.marker": ThreadMarkerContent;
    }
}

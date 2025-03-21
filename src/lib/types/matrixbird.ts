import type { MatrixEvent } from 'matrix-js-sdk/lib/models/event'

export type { MatrixEvent };

export type Emails = Record<string, MatrixEvent>;

export type Threads = Map<string, MatrixEvent>;
export type ThreadEvents = Map<string, MatrixEvent[]>;



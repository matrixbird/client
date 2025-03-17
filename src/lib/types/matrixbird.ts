import { type IEvent as MatrixEvent} from 'matrix-js-sdk'
export type { MatrixEvent };

export type Emails = Record<string, MatrixEvent>;

export type Threads = Map<string, MatrixEvent>;
export type ThreadEvents = Map<string, MatrixEvent[]>;



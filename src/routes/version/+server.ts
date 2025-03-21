import { json } from '@sveltejs/kit';

const commit = COMMIT;
const link = LINK;

export function GET() {
    const data = {
        'commit': commit,
        'source': link
    }
    return json(data);
}


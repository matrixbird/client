import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ parent, fetch, url }) => {

    const { MATRIXBIRD_SERVER } = await parent();

    const endpoint = `${MATRIXBIRD_SERVER}/features/authentication`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error('Failed to fetch authentication features');
        }
        const data = await response.json();

        const code = url.searchParams.get('code')
        if(code) {
            const endpoint = `${MATRIXBIRD_SERVER}/auth/code/validate/${code}`;
            const res = await fetch(endpoint);
            const json = await res.json();
            if(json?.valid) {
                json.code = code;
                data.invite_code = json;
            }
        }

        return data;
    } catch (err) {
        console.error("Error:", err);
        error(500, {
            message: err?.message,
        });
    }

}

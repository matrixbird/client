import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ parent, fetch, url }) => {

    const { MATRIXBIRD_SERVER } = await parent();

    const endpoint = `${MATRIXBIRD_SERVER}/features/authentication`;
    const res = await fetch(endpoint);
    const data = await res.json();

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

}

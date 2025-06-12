import { redirect } from "@sveltejs/kit";
import { parse } from 'tldts';

import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ( { cookies, fetch, url } ) => {

    let data: any;

    let access_token = cookies.get("access_token");

    if(access_token) {
        redirect(303, '/mail/inbox');
    }

    let domain = parse(url.origin).domain;
    console.log("Domain:", domain);

    const endpoint = `https://${domain}/.well-known/matrixbird/client`;

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Failed to fetch well-known client data: ${response.statusText}`);
        }
        const resp = await response.json();
        if(resp?.["matrixbird.server"]?.url) {
            data = resp
        }
        console.log("Well-known data:", data);


    } catch (error) {
        console.error("Error fetching well-known client data:", error);
    }

    return data;
}
